package id

import (
	"reflect"
	"testing"

	"github.com/google/uuid"
)

var uuidStrForTest = "457ff1e4-8705-4a75-8002-c185a3661430"
var uuidForTest = uuid.MustParse(uuidStrForTest)

func TestUUID_String(t *testing.T) {
	tests := []struct {
		name string
		u    UUID
		want string
	}{
		{
			name: "return uuid string",
			u: UUID{
				value: uuidForTest,
			},
			want: uuidStrForTest,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.u.String(); got != tt.want {
				t.Errorf("UUID.String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGenerateUUID(t *testing.T) {
	t.Run("generates valid UUID", func(t *testing.T) {
		got := GenerateUUID()
		if got.String() == "" {
			t.Error("GenerateUUID() returned empty UUID")
		}
	})

	t.Run("generates different UUIDs", func(t *testing.T) {
		uuid1 := GenerateUUID()
		uuid2 := GenerateUUID()
		if uuid1.String() == uuid2.String() {
			t.Error("GenerateUUID() returned same UUID twice")
		}
	})
}

func TestParseUUID(t *testing.T) {
	type args struct {
		s string
	}
	tests := []struct {
		name    string
		args    args
		want    UUID
		wantErr bool
	}{
		{
			"return uuid if string is valid",
			args{
				uuidStrForTest,
			},
			UUID{uuidForTest},
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseUUID(tt.args.s)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseUUID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseUUID() = %v, want %v", got, tt.want)
			}
		})
	}
}
