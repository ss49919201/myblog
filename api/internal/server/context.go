package server

import (
	"context"
	"net/http"
)

type errorKey struct{}

func SetError(r *http.Request, err error) {
	*r = *r.WithContext(context.WithValue(r.Context(), errorKey{}, err))
}

func GetError(r *http.Request) (error, bool) {
	err, ok := r.Context().Value(errorKey{}).(error)
	return err, ok
}
