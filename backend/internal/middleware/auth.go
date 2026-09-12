package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type cachedUser struct {
	UserID    string
	Email     string
	ExpiresAt time.Time
}

var (
	tokenCache   = make(map[string]cachedUser)
	cacheMutex   sync.RWMutex
	supabaseURL  = os.Getenv("SUPABASE_URL")
	supabaseKey  = os.Getenv("SUPABASE_ANON_KEY")
	supabaseJWTSecret = os.Getenv("SUPABASE_JWT_SECRET")
)

func init() {
	if supabaseURL == "" {
		supabaseURL = "https://tjloylnetfaefuoyfwxy.supabase.co"
	}
	if supabaseKey == "" {
		supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbG95bG5ldGZhZWZ1b3lmd3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjgyNDEsImV4cCI6MjEwNDgwNDI0MX0.m37ei41UitZJ5J7EMrokNQnFy4sezNkqEkGuj1Mu_Ho"
	}
}

// AuthMiddleware validates Supabase JWTs and enforces user authentication.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Missing Authorization header",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid Authorization header format. Expected 'Bearer <token>'",
			})
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Empty bearer token",
			})
			return
		}

		// Check local in-memory cache first for high throughput
		cacheMutex.RLock()
		if cached, ok := tokenCache[tokenString]; ok {
			if time.Now().Before(cached.ExpiresAt) {
				cacheMutex.RUnlock()
				c.Set("userID", cached.UserID)
				c.Set("userEmail", cached.Email)
				c.Next()
				return
			}
		}
		cacheMutex.RUnlock()

		jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
		if jwtSecret != "" {
			// Fast path: Validate token signature locally with HMAC secret
			token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if sub, ok := claims["sub"].(string); ok && sub != "" {
						email, _ := claims["email"].(string)

						// Cache for 2 minutes
						cacheMutex.Lock()
						tokenCache[tokenString] = cachedUser{
							UserID:    sub,
							Email:     email,
							ExpiresAt: time.Now().Add(2 * time.Minute),
						}
						cacheMutex.Unlock()

						c.Set("userID", sub)
						c.Set("userEmail", email)
						c.Next()
						return
					}
				}
			}
		}

		// Remote verification path with Supabase Auth API
		// This securely validates against Supabase directly
		req, err := http.NewRequestWithContext(c.Request.Context(), "GET", supabaseURL+"/auth/v1/user", nil)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create authentication request",
			})
			return
		}

		req.Header.Set("Authorization", "Bearer "+tokenString)
		req.Header.Set("apikey", supabaseKey)

		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"error": "Authentication service unavailable",
			})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		var userInfo struct {
			ID    string `json:"id"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil || userInfo.ID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Failed to parse authenticated user information",
			})
			return
		}

		// Cache successful validation for 2 minutes to minimize network latency
		cacheMutex.Lock()
		tokenCache[tokenString] = cachedUser{
			UserID:    userInfo.ID,
			Email:     userInfo.Email,
			ExpiresAt: time.Now().Add(2 * time.Minute),
		}
		cacheMutex.Unlock()

		c.Set("userID", userInfo.ID)
		c.Set("userEmail", userInfo.Email)
		c.Next()
	}
}
