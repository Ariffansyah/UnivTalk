package Handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
)

func GetUniversities(c *gin.Context, cacheData *cache.Cache) {
	var universities []map[string]any
	data, found := cacheData.Get("universities")
	if found {
		universities = data.([]map[string]any)
	} else {
		data, err := os.ReadFile("./assets/data.json")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file", "detail": err.Error()})
			return
		}

		if err := json.Unmarshal(data, &universities); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid JSON"})
			return
		}
		cacheData.Set("universities", universities, cache.DefaultExpiration)
	}

	nameFilter := c.Query("name")
	var filteredUnivs []string

	for _, u := range universities {
		if nameFilter == "" || strings.Contains(strings.ToLower(u["name"].(string)), strings.ToLower(nameFilter)) {
			filteredUnivs = append(filteredUnivs, u["name"].(string))
		}
	}

	c.JSON(http.StatusOK, filteredUnivs)
}
