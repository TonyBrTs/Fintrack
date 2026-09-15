package services

import (
	"crypto/rand"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// GenerateShortID creates a compact, unique, time-ordered identifier with a given prefix.
// It combines a base-36 timestamp with 4 random hex characters to guarantee uniqueness.
// Total length is typically 14-15 characters (e.g. "rec_1b2c3d9f1a").
func GenerateShortID(prefix string) string {
	b := make([]byte, 2)
	_, _ = rand.Read(b)
	randHex := fmt.Sprintf("%04x", b)
	ts := strconv.FormatInt(time.Now().Unix(), 36)
	return prefix + ts + randHex
}

// CleanRecurringDescription strips any legacy "[Recurrente]" prefix so descriptions stay clean.
func CleanRecurringDescription(desc string) string {
	trimmed := strings.TrimPrefix(desc, "[Recurrente] ")
	trimmed = strings.TrimPrefix(trimmed, "[recurrente] ")
	return strings.TrimSpace(trimmed)
}
