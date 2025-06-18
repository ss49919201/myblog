package post

import "errors"

// ErrValidation represents a validation error
type ErrValidation struct {
	Field   string
	Message string
}

func (e *ErrValidation) Error() string {
	return e.Message
}

// NewValidationError creates a new validation error
func NewValidationError(field, message string) *ErrValidation {
	return &ErrValidation{
		Field:   field,
		Message: message,
	}
}

// IsErrValidation checks if the error is a validation error
func IsErrValidation(err error) bool {
	var validationErr *ErrValidation
	return errors.As(err, &validationErr)
}

// AsErrValidation attempts to convert error to ErrValidation
func AsErrValidation(err error) (*ErrValidation, bool) {
	if err == nil {
		return nil, false
	}

	var validationErr *ErrValidation
	if errors.As(err, &validationErr) {
		return validationErr, true
	}

	return nil, false
}