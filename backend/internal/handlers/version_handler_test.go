package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestVersionCheckHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/version", VersionCheck)

	req, err := http.NewRequest(http.MethodGet, "/version", nil)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got: %d", w.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse json response: %v", err)
	}

	if resp["status"] != "ok" {
		t.Errorf("expected status 'ok', got: %v", resp["status"])
	}
	if resp["service"] != "fintrack-backend" {
		t.Errorf("expected service 'fintrack-backend', got: %v", resp["service"])
	}
	if resp["current_commit"] == nil {
		t.Errorf("expected current_commit not to be nil")
	}
}
