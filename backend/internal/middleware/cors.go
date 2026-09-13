package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware handles Cross-Origin Resource Sharing with production and preview domains support.
func CORSMiddleware() gin.HandlerFunc {
	frontendURL := os.Getenv("FRONTEND_URL")

	return func(ctx *gin.Context) {
		origin := ctx.Request.Header.Get("Origin")
		if origin != "" {
			isAllowed := false

			if frontendURL == "" || frontendURL == "*" {
				isAllowed = true
			} else if origin == frontendURL ||
				strings.HasSuffix(origin, ".vercel.app") ||
				strings.HasPrefix(origin, "http://localhost:") ||
				origin == "http://localhost:3000" {
				isAllowed = true
			} else {
				for _, allowed := range strings.Split(frontendURL, ",") {
					if strings.TrimSpace(allowed) == origin {
						isAllowed = true
						break
					}
				}
			}

			if isAllowed {
				ctx.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				ctx.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
			}
		} else {
			ctx.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		ctx.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		ctx.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")
		ctx.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if ctx.Request.Method == http.MethodOptions {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}
		ctx.Next()
	}
}
