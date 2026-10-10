package option_test

import (
	"strings"
	"testing"

	"github.com/ss49919201/myblog/tools/internal/option"
)

func TestOptionAPI(t *testing.T) {
	someInt := option.Some(42)
	noneInt := option.None[int]()

	t.Run("IsDefined/IsEmpty", func(t *testing.T) {
		cases := []struct {
			name     string
			o        option.Option[int]
			defined  bool
			empty    bool
		}{
			{"some", someInt, true, false},
			{"none", noneInt, false, true},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				if tc.o.IsDefined() != tc.defined {
					t.Fatalf("IsDefined() = %v, want %v", tc.o.IsDefined(), tc.defined)
				}
				if tc.o.IsEmpty() != tc.empty {
					t.Fatalf("IsEmpty() = %v, want %v", tc.o.IsEmpty(), tc.empty)
				}
			})
		}
	})

	t.Run("Get", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			val  int
			ok   bool
		}{
			{"some", someInt, 42, true},
			{"none", noneInt, 0, false},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				v, ok := tc.o.Get()
				if v != tc.val || ok != tc.ok {
					t.Fatalf("Get() = (%v, %v), want (%v, %v)", v, ok, tc.val, tc.ok)
				}
			})
		}
	})

	t.Run("GetOrElse", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			want int
		}{
			{"some", someInt, 42},
			{"none", noneInt, 99},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				if got := tc.o.GetOrElse(99); got != tc.want {
					t.Fatalf("GetOrElse(99) = %v, want %v", got, tc.want)
				}
			})
		}
	})

	t.Run("OrElse", func(t *testing.T) {
		alt := option.Some(7)
		cases := []struct {
			name string
			o    option.Option[int]
			want option.Option[int]
		}{
			{"some", someInt, someInt},
			{"none", noneInt, alt},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := tc.o.OrElse(func() option.Option[int] { return alt })
				gv, gok := got.Get()
				wv, wok := tc.want.Get()
				if gok != wok || gv != wv {
					t.Fatalf("OrElse = (%v, %v), want (%v, %v)", gv, gok, wv, wok)
				}
			})
		}
	})

	t.Run("Map", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			want option.Option[string]
		}{
			{
				"some",
				someInt,
				option.Some("42"),
			},
			{
				"none",
				noneInt,
				option.None[string](),
			},
		}
		double := func(n int) string { return strings.Repeat("x", n) }
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := tc.o.Map(func(n int) string {
					if n == 42 {
						return "42"
					}
					return double(n)
				})
				gv, gok := got.Get()
				wv, wok := tc.want.Get()
				if gok != wok || gv != wv {
					t.Fatalf("Map = (%q, %v), want (%q, %v)", gv, gok, wv, wok)
				}
			})
		}
	})

	t.Run("FlatMap", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			want option.Option[int]
		}{
			{"some_some", someInt, option.Some(42)},
			{"some_none", option.Some(0), option.None[int]()},
			{"none", noneInt, option.None[int]()},
		}
		f := func(n int) option.Option[int] {
			if n == 0 {
				return option.None[int]()
			}
			return option.Some(n)
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := tc.o.FlatMap(f)
				gv, gok := got.Get()
				wv, wok := tc.want.Get()
				if gok != wok || gv != wv {
					t.Fatalf("FlatMap = (%v, %v), want (%v, %v)", gv, gok, wv, wok)
				}
			})
		}
	})

	t.Run("Filter", func(t *testing.T) {
		even := func(n int) bool { return n%2 == 0 }
		cases := []struct {
			name string
			o    option.Option[int]
			want option.Option[int]
		}{
			{"some_pass", someInt, someInt},
			{"some_fail", option.Some(41), option.None[int]()},
			{"none", noneInt, noneInt},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := tc.o.Filter(even)
				gv, gok := got.Get()
				wv, wok := tc.want.Get()
				if gok != wok || gv != wv {
					t.Fatalf("Filter = (%v, %v), want (%v, %v)", gv, gok, wv, wok)
				}
			})
		}
	})

	t.Run("Fold", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			want int
		}{
			{"some", someInt, 84},
			{"none", noneInt, -1},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := tc.o.Fold(-1, func(n int) int { return n * 2 })
				if got != tc.want {
					t.Fatalf("Fold = %v, want %v", got, tc.want)
				}
			})
		}
	})

	t.Run("Foreach", func(t *testing.T) {
		var seen []int
		cases := []struct {
			name string
			o    option.Option[int]
			want []int
		}{
			{"some", someInt, []int{42}},
			{"none", noneInt, nil},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				seen = nil
				tc.o.Foreach(func(n int) { seen = append(seen, n) })
				if len(seen) != len(tc.want) {
					t.Fatalf("Foreach saw %v, want %v", seen, tc.want)
				}
				for i := range seen {
					if seen[i] != tc.want[i] {
						t.Fatalf("Foreach saw %v, want %v", seen, tc.want)
					}
				}
			})
		}
	})

	t.Run("Contains", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			v    int
			want bool
		}{
			{"some_match", someInt, 42, true},
			{"some_miss", someInt, 1, false},
			{"none", noneInt, 42, false},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				if got := option.Contains(tc.o, tc.v); got != tc.want {
					t.Fatalf("Contains(%v) = %v, want %v", tc.v, got, tc.want)
				}
			})
		}
	})

	t.Run("Exists", func(t *testing.T) {
		pos := func(n int) bool { return n > 0 }
		cases := []struct {
			name string
			o    option.Option[int]
			want bool
		}{
			{"some_true", someInt, true},
			{"some_false", option.Some(-1), false},
			{"none", noneInt, false},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				if got := tc.o.Exists(pos); got != tc.want {
					t.Fatalf("Exists = %v, want %v", got, tc.want)
				}
			})
		}
	})

	t.Run("ForAll", func(t *testing.T) {
		pos := func(n int) bool { return n > 0 }
		cases := []struct {
			name string
			o    option.Option[int]
			want bool
		}{
			{"some_true", someInt, true},
			{"some_false", option.Some(-1), false},
			{"none", noneInt, true},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				if got := tc.o.ForAll(pos); got != tc.want {
					t.Fatalf("ForAll = %v, want %v", got, tc.want)
				}
			})
		}
	})

	t.Run("ToSlice", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			want []int
		}{
			{"some", someInt, []int{42}},
			{"none", noneInt, nil},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := tc.o.ToSlice()
				if len(got) != len(tc.want) {
					t.Fatalf("ToSlice = %v, want %v", got, tc.want)
				}
				for i := range got {
					if got[i] != tc.want[i] {
						t.Fatalf("ToSlice = %v, want %v", got, tc.want)
					}
				}
			})
		}
	})

	t.Run("String", func(t *testing.T) {
		cases := []struct {
			name string
			o    option.Option[int]
			want string
		}{
			{"some", someInt, "Some(42)"},
			{"none", noneInt, "None"},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				if got := tc.o.String(); got != tc.want {
					t.Fatalf("String() = %q, want %q", got, tc.want)
				}
			})
		}
	})

	t.Run("FromPtr", func(t *testing.T) {
		v := 3
		cases := []struct {
			name string
			p    *int
			want option.Option[int]
		}{
			{"nil", nil, option.None[int]()},
			{"some", &v, option.Some(3)},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := option.FromPtr(tc.p)
				gv, gok := got.Get()
				wv, wok := tc.want.Get()
				if gok != wok || gv != wv {
					t.Fatalf("FromPtr = (%v, %v), want (%v, %v)", gv, gok, wv, wok)
				}
			})
		}
	})

	t.Run("ToPtr", func(t *testing.T) {
		cases := []struct {
			name   string
			o      option.Option[int]
			isNil  bool
			pointV int
		}{
			{"some", someInt, false, 42},
			{"none", noneInt, true, 0},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				p := tc.o.ToPtr()
				if tc.isNil {
					if p != nil {
						t.Fatalf("ToPtr() = %v, want nil", p)
					}
					return
				}
				if p == nil || *p != tc.pointV {
					t.Fatalf("ToPtr() = %v, want %d", p, tc.pointV)
				}
			})
		}
	})

	t.Run("FromZero", func(t *testing.T) {
		cases := []struct {
			name string
			v    int
			want option.Option[int]
		}{
			{"zero", 0, option.None[int]()},
			{"nonzero", 5, option.Some(5)},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				got := option.FromZero(tc.v)
				gv, gok := got.Get()
				wv, wok := tc.want.Get()
				if gok != wok || gv != wv {
					t.Fatalf("FromZero = (%v, %v), want (%v, %v)", gv, gok, wv, wok)
				}
			})
		}
	})
}
