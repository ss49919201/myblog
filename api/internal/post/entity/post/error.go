package post

import "errors"

type ErrPostNotFound struct {
}

func (e *ErrPostNotFound) Error() string {
	return "post not found"
}

func AsErrPostNotFound(err error) (*ErrPostNotFound, bool) {
	if err == nil {
		return nil, false
	}

	var result *ErrPostNotFound
	if errors.As(err, &result) {
		return result, true
	}

	return nil, false
}
