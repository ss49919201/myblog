package option_test

import (
	"fmt"

	"github.com/ss49919201/myblog/tools/internal/option"
)

func ExampleSome_map() {
	greeting := option.Some("world").Map(func(s string) string {
		return "hello, " + s
	})
	fmt.Println(greeting.GetOrElse("missing"))
	// Output: hello, world
}

func ExampleNone_orElse() {
	fallback := option.None[string]().OrElse(func() option.Option[string] {
		return option.Some("default")
	})
	fmt.Println(fallback.String())
	// Output: Some(default)
}

func ExampleSome_flatMap() {
	half := func(n int) option.Option[int] {
		if n%2 != 0 {
			return option.None[int]()
		}
		return option.Some(n / 2)
	}
	fmt.Println(option.Some(10).FlatMap(half).String())
	fmt.Println(option.Some(9).FlatMap(half).String())
	// Output:
	// Some(5)
	// None
}
