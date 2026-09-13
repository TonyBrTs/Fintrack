package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/TonyBrTs/fintrack-backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func TestCORSMiddleware_PreflightOptions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.CORSMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req, _ := http.NewRequest(http.MethodOptions, "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204 No Content on OPTIONS, got: %d", w.Code)
	}

	allowOrigin := w.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "http://localhost:3000" {
		t.Errorf("expected Access-Control-Allow-Origin to be http://localhost:3000, got: %s", allowOrigin)
	}

	allowMethods := w.Header().Get("Access-Control-Allow-Methods")
	if allowMethods == "" {
		t.Errorf("expected Access-Control-Allow-Methods to be set")
	}
}

func TestCORSMiddleware_VercelPreviewAllowed(t *testing.T) {
	os.Setenv("FRONTEND_URL", "https://fintrack.app")
	defer os.Unsetenv("FRONTEND_URL")

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.CORSMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req, _ := http.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://fintrack-preview-abc.vercel.app")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	allowOrigin := w.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "https://fintrack-preview-abc.vercel.app" {
		t.Errorf("expected preview origin to be allowed, got: %s", allowOrigin)
	}
}
