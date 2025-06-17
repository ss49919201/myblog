package post

import (
	"errors"
	"testing"
)

func TestAsErrPostNotFound(t *testing.T) {
	tests := []struct {
		name        string
		err         error
		expectedErr *ErrPostNotFound
		expectedOk  bool
	}{
		{
			name:        "should return ErrPostNotFound and true for ErrPostNotFound",
			err:         &ErrPostNotFound{},
			expectedErr: &ErrPostNotFound{},
			expectedOk:  true,
		},
		{
			name:        "should return nil and false for other error",
			err:         errors.New("other error"),
			expectedErr: nil,
			expectedOk:  false,
		},
		{
			name:        "should return nil and false for nil error",
			err:         nil,
			expectedErr: nil,
			expectedOk:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err, ok := AsErrPostNotFound(tt.err)
			if ok != tt.expectedOk {
				t.Errorf("AsErrPostNotFound() ok = %v, want %v", ok, tt.expectedOk)
			}
			if (err == nil) != (tt.expectedErr == nil) {
				t.Errorf("AsErrPostNotFound() err = %v, want %v", err, tt.expectedErr)
			}
			if err != nil && tt.expectedErr != nil && *err != *tt.expectedErr {
				t.Errorf("AsErrPostNotFound() err = %v, want %v", *err, *tt.expectedErr)
			}
		})
	}
}
