package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/joho/godotenv"
)

var db *sql.DB

func init() {
	godotenv.Load()
}

func main() {
	// Setup database
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL not set")
	}

	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("✅ Database connected")

	// Setup router
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public API routes
	r.GET("/api/branches", getBranches)
	r.GET("/api/branches/:id", getBranch)
	r.POST("/api/bookings", createBooking)
	r.GET("/api/bookings/:code/status", getBookingStatus)
	r.GET("/api/payments/banks", getPaymentBanks)
	r.POST("/api/payments/notify", notifyPayment)

	// Admin routes (stub for now)
	r.GET("/api/admin/branches", adminGetBranches)
	r.POST("/api/admin/branches", adminCreateBranch)
	r.PUT("/api/admin/branches/:id", adminUpdateBranch)
	r.DELETE("/api/admin/branches/:id", adminDeleteBranch)

	r.GET("/api/admin/staff", adminGetStaff)
	r.POST("/api/admin/staff", adminCreateStaff)

	r.GET("/api/admin/payments/banks", adminGetPayments)
	r.POST("/api/admin/payments/verify", adminVerifyPayment)

	r.GET("/api/technicians/tasks", getTechnicianTasks)
	r.PUT("/api/technicians/tasks/:id/progress", updateTaskProgress)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Server running on port %s\n", port)
	r.Run(":" + port)
}

// Public endpoints
func getBranches(c *gin.Context) {
	c.JSON(200, gin.H{"branches": []gin.H{}})
}

func getBranch(c *gin.Context) {
	c.JSON(200, gin.H{"branch": gin.H{}})
}

func createBooking(c *gin.Context) {
	c.JSON(201, gin.H{"booking_id": "", "code": ""})
}

func getBookingStatus(c *gin.Context) {
	c.JSON(200, gin.H{"status": "pending"})
}

func getPaymentBanks(c *gin.Context) {
	c.JSON(200, gin.H{"banks": []gin.H{}})
}

func notifyPayment(c *gin.Context) {
	c.JSON(200, gin.H{"success": true})
}

// Admin endpoints
func adminGetBranches(c *gin.Context) {
	c.JSON(200, gin.H{"branches": []gin.H{}})
}

func adminCreateBranch(c *gin.Context) {
	c.JSON(201, gin.H{"id": "", "name": ""})
}

func adminUpdateBranch(c *gin.Context) {
	c.JSON(200, gin.H{"success": true})
}

func adminDeleteBranch(c *gin.Context) {
	c.JSON(204, nil)
}

func adminGetStaff(c *gin.Context) {
	c.JSON(200, gin.H{"staff": []gin.H{}})
}

func adminCreateStaff(c *gin.Context) {
	c.JSON(201, gin.H{"id": "", "name": ""})
}

func adminGetPayments(c *gin.Context) {
	c.JSON(200, gin.H{"payments": []gin.H{}})
}

func adminVerifyPayment(c *gin.Context) {
	c.JSON(200, gin.H{"success": true})
}

// Technician endpoints
func getTechnicianTasks(c *gin.Context) {
	c.JSON(200, gin.H{"tasks": []gin.H{}})
}

func updateTaskProgress(c *gin.Context) {
	c.JSON(200, gin.H{"success": true})
}
