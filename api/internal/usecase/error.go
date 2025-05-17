package usecase

type ErrInvalidParameter struct {
	err error
}

func (e *ErrInvalidParameter) Error() string {
	return "invalid parameter: " + e.err.Error()
}

func NewErrInvalidParameter(err error) *ErrInvalidParameter {
	return &ErrInvalidParameter{
		err: err,
	}
}
