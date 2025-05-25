package usecase

type ErrorKind string

const (
	ErrInvalidParameter ErrorKind = "invalid parameter"
	ErrResourceNotFound ErrorKind = "resource not found"
)

type Error struct {
	Kind ErrorKind
	err  error
}

func NewError(kind ErrorKind, err error) error {
	return &Error{
		Kind: kind,
		err:  err,
	}
}

func (e *Error) Error() string {
	return string(e.Kind) + ": " + e.err.Error()
}

func (e *Error) Unwrap() error {
	return e.err
}
