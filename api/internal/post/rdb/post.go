package rdb

import (
	"errors"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

func FindPostByID(id post.PostID) (*post.Post, error) {
	return nil, errors.New("not implemented")
}

func SavePost(post *post.Post) error {
	return errors.New("not implemented")
}
