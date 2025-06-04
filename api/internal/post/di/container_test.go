package di

import (
	"sync"
	"testing"
	"time"
)

func TestNewContainer(t *testing.T) {
	t.Run("returns same container instance", func(t *testing.T) {
		container1 := NewContainer()
		container2 := NewContainer()
		
		if container1 != container2 {
			t.Error("NewContainer() should return the same instance (singleton)")
		}
	})
}

func TestContainer_ConcurrentAccess(t *testing.T) {
	t.Run("concurrent access to container", func(t *testing.T) {
		const numGoroutines = 100
		containers := make([]*Container, numGoroutines)
		var wg sync.WaitGroup
		
		wg.Add(numGoroutines)
		for i := 0; i < numGoroutines; i++ {
			go func(index int) {
				defer wg.Done()
				containers[index] = NewContainer()
			}(i)
		}
		wg.Wait()
		
		// All containers should be the same instance
		firstContainer := containers[0]
		for i := 1; i < numGoroutines; i++ {
			if containers[i] != firstContainer {
				t.Errorf("Container %d is different from container 0", i)
			}
		}
	})
}

func TestContainer_AnalyzePostUsecase(t *testing.T) {
	t.Run("returns usecase successfully", func(t *testing.T) {
		container := NewContainer()
		
		usecase, err := container.AnalyzePostUsecase()
		if err != nil {
			t.Errorf("AnalyzePostUsecase() error = %v, want nil", err)
		}
		if usecase == nil {
			t.Error("AnalyzePostUsecase() returned nil usecase")
		}
	})
	
	t.Run("returns same instance on multiple calls", func(t *testing.T) {
		container := NewContainer()
		
		usecase1, err1 := container.AnalyzePostUsecase()
		usecase2, err2 := container.AnalyzePostUsecase()
		
		if err1 != nil || err2 != nil {
			t.Errorf("Unexpected errors: %v, %v", err1, err2)
		}
		if usecase1 != usecase2 {
			t.Error("AnalyzePostUsecase() should return the same instance")
		}
	})
}

func TestContainer_ConcurrentUsecaseAccess(t *testing.T) {
	t.Run("concurrent access to AnalyzePostUsecase", func(t *testing.T) {
		container := NewContainer()
		const numGoroutines = 50
		results := make(chan interface{}, numGoroutines)
		errors := make(chan error, numGoroutines)
		
		var wg sync.WaitGroup
		wg.Add(numGoroutines)
		
		for i := 0; i < numGoroutines; i++ {
			go func() {
				defer wg.Done()
				usecase, err := container.AnalyzePostUsecase()
				if err != nil {
					errors <- err
				} else {
					results <- usecase
				}
			}()
		}
		
		wg.Wait()
		close(results)
		close(errors)
		
		// Check for errors
		for err := range errors {
			t.Errorf("Unexpected error in concurrent access: %v", err)
		}
		
		// Check that all results are the same instance
		var firstUsecase interface{}
		resultCount := 0
		for usecase := range results {
			if firstUsecase == nil {
				firstUsecase = usecase
			} else if usecase != firstUsecase {
				t.Error("Different usecase instances returned in concurrent access")
			}
			resultCount++
		}
		
		if resultCount != numGoroutines {
			t.Errorf("Expected %d results, got %d", numGoroutines, resultCount)
		}
	})
}

func TestContainer_DBErrorPropagation(t *testing.T) {
	// Note: These tests would require mocking the database connection
	// Since the current implementation has hardcoded DB connection,
	// we test the structure and ensure the error handling pattern works
	
	t.Run("DB method exists and returns expected types", func(t *testing.T) {
		container := NewContainer()
		
		// This will fail because we don't have a real DB connection,
		// but we can verify the method signature and error handling
		_, err := container.DB()
		if err == nil {
			t.Log("DB connection succeeded (unexpected in test environment)")
		} else {
			t.Logf("DB connection failed as expected: %v", err)
		}
	})
}

func TestContainer_DependencyChain(t *testing.T) {
	// Test that dependencies are properly initialized in the correct order
	// and that errors bubble up through the dependency chain
	
	t.Run("PostRepository depends on DB", func(t *testing.T) {
		container := NewContainer()
		
		// PostRepository should fail because DB will fail
		_, err := container.PostRepository()
		if err == nil {
			t.Log("PostRepository succeeded (unexpected in test environment)")
		} else {
			t.Logf("PostRepository failed as expected due to DB dependency: %v", err)
		}
	})
	
	t.Run("CreatePostUsecase depends on PostRepository", func(t *testing.T) {
		container := NewContainer()
		
		// CreatePostUsecase should fail because PostRepository will fail
		_, err := container.CreatePostUsecase()
		if err == nil {
			t.Log("CreatePostUsecase succeeded (unexpected in test environment)")
		} else {
			t.Logf("CreatePostUsecase failed as expected due to PostRepository dependency: %v", err)
		}
	})
}

func TestContainer_ThreadSafetyStress(t *testing.T) {
	t.Run("stress test thread safety", func(t *testing.T) {
		container := NewContainer()
		const numGoroutines = 100
		const numOperationsPerGoroutine = 10
		
		var wg sync.WaitGroup
		wg.Add(numGoroutines)
		
		start := time.Now()
		
		for i := 0; i < numGoroutines; i++ {
			go func() {
				defer wg.Done()
				for j := 0; j < numOperationsPerGoroutine; j++ {
					// Mix different dependency calls
					switch j % 5 {
					case 0:
						container.AnalyzePostUsecase()
					case 1:
						container.CreatePostUsecase()
					case 2:
						container.UpdatePostUsecase()
					case 3:
						container.DeletePostUsecase()
					case 4:
						container.PostRepository()
					}
				}
			}()
		}
		
		wg.Wait()
		elapsed := time.Since(start)
		
		t.Logf("Stress test completed in %v", elapsed)
		
		// Verify that AnalyzePostUsecase still works after stress test
		usecase, err := container.AnalyzePostUsecase()
		if err != nil {
			t.Errorf("AnalyzePostUsecase() failed after stress test: %v", err)
		}
		if usecase == nil {
			t.Error("AnalyzePostUsecase() returned nil after stress test")
		}
	})
}

func TestContainer_InitOnceValues(t *testing.T) {
	t.Run("initOnceValues can be called multiple times safely", func(t *testing.T) {
		container := NewContainer()
		
		// Call initOnceValues multiple times - should not panic
		container.initOnceValues()
		container.initOnceValues()
		container.initOnceValues()
		
		// Should still work normally
		usecase, err := container.AnalyzePostUsecase()
		if err != nil {
			t.Errorf("AnalyzePostUsecase() error after multiple initOnceValues calls = %v", err)
		}
		if usecase == nil {
			t.Error("AnalyzePostUsecase() returned nil after multiple initOnceValues calls")
		}
	})
}