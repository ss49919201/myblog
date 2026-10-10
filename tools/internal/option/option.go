package option

import "fmt"

// Option is a value that may or may not be present, similar to Scala's Option.
type Option[T any] struct {
	value T
	ok    bool
}

// Some wraps a present value.
func Some[T any](v T) Option[T] {
	return Option[T]{value: v, ok: true}
}

// None is an empty Option.
func None[T any]() Option[T] {
	return Option[T]{}
}

// IsDefined reports whether the value is present.
func (o Option[T]) IsDefined() bool { return o.ok }

// IsEmpty reports whether the value is absent.
func (o Option[T]) IsEmpty() bool { return !o.ok }

// Get returns the value and whether it is present.
func (o Option[T]) Get() (T, bool) {
	return o.value, o.ok
}

// GetOrElse returns the value if present, otherwise defaultValue.
func (o Option[T]) GetOrElse(defaultValue T) T {
	if o.ok {
		return o.value
	}
	return defaultValue
}

// OrElse returns this Option if present, otherwise the result of alternate.
func (o Option[T]) OrElse(alternate func() Option[T]) Option[T] {
	if o.ok {
		return o
	}
	return alternate()
}

// Map applies f to the value if present.
func (o Option[T]) Map[U any](f func(T) U) Option[U] {
	if !o.ok {
		return None[U]()
	}
	return Some(f(o.value))
}

// FlatMap applies f to the value if present.
func (o Option[T]) FlatMap[U any](f func(T) Option[U]) Option[U] {
	if !o.ok {
		return None[U]()
	}
	return f(o.value)
}

// Filter keeps the value only when pred holds.
func (o Option[T]) Filter(pred func(T) bool) Option[T] {
	if !o.ok || !pred(o.value) {
		return None[T]()
	}
	return o
}

// Fold returns ifEmpty when absent, otherwise f(value).
func (o Option[T]) Fold[U any](ifEmpty U, f func(T) U) U {
	if !o.ok {
		return ifEmpty
	}
	return f(o.value)
}

// Foreach runs f on the value when present.
func (o Option[T]) Foreach(f func(T)) {
	if o.ok {
		f(o.value)
	}
}

// Contains reports whether the value is present and equal to v.
func Contains[T comparable](o Option[T], v T) bool {
	if !o.ok {
		return false
	}
	return o.value == v
}

// Exists reports whether the value is present and pred holds.
func (o Option[T]) Exists(pred func(T) bool) bool {
	return o.ok && pred(o.value)
}

// ForAll reports whether the value is absent or pred holds.
func (o Option[T]) ForAll(pred func(T) bool) bool {
	return !o.ok || pred(o.value)
}

// ToSlice returns a one-element slice when present, otherwise nil.
func (o Option[T]) ToSlice() []T {
	if !o.ok {
		return nil
	}
	return []T{o.value}
}

// String formats the Option for debugging.
func (o Option[T]) String() string {
	if !o.ok {
		return "None"
	}
	return fmt.Sprintf("Some(%v)", o.value)
}

// FromPtr returns None when p is nil, otherwise Some(*p).
func FromPtr[T any](p *T) Option[T] {
	if p == nil {
		return None[T]()
	}
	return Some(*p)
}

// ToPtr returns nil when empty, otherwise a pointer to the value.
func (o Option[T]) ToPtr() *T {
	if !o.ok {
		return nil
	}
	v := o.value
	return &v
}

// FromZero returns None when v is the zero value, otherwise Some(v).
func FromZero[T comparable](v T) Option[T] {
	var zero T
	if v == zero {
		return None[T]()
	}
	return Some(v)
}
