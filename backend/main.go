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
	branches, err := queryGetBranches(db)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if branches == nil {
		branches = []Branch{}
	}
	c.JSON(200, gin.H{"branches": branches})
}

func getBranch(c *gin.Context) {
	id := c.Param("id")
	branch, err := queryGetBranch(db, id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if branch == nil {
		c.JSON(404, gin.H{"error": "branch not found"})
		return
	}
	c.JSON(200, gin.H{"branch": branch})
}

func createBooking(c *gin.Context) {
	var req struct {
		GuestName  *string `json:"guest_name"`
		GuestPhone *string `json:"guest_phone"`
		BranchID   *string `json:"branch_id"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	booking, err := queryCreateBooking(db, req.GuestName, req.GuestPhone, req.BranchID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"booking_id": booking.ID, "code": booking.BookingToken})
}

func getBookingStatus(c *gin.Context) {
	code := c.Param("code")
	booking, err := queryGetBookingStatus(db, code)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if booking == nil {
		c.JSON(404, gin.H{"error": "booking not found"})
		return
	}
	c.JSON(200, gin.H{"status": booking.Status})
}

func getPaymentBanks(c *gin.Context) {
	banks := queryGetPaymentBanks()
	c.JSON(200, gin.H{"banks": banks})
}

func notifyPayment(c *gin.Context) {
	var req struct {
		BookingID string `json:"booking_id"`
		Amount    int    `json:"amount"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}

// Admin endpoints
func adminGetBranches(c *gin.Context) {
	branches, err := queryGetBranches(db)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if branches == nil {
		branches = []Branch{}
	}
	c.JSON(200, gin.H{"branches": branches})
}

func adminCreateBranch(c *gin.Context) {
	var req struct {
		Name string  `json:"name" binding:"required"`
		Code *string `json:"code"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "name is required"})
		return
	}

	branch, err := queryCreateBranch(db, req.Name, req.Code)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": branch.ID, "name": branch.Name, "code": branch.Code})
}

func adminUpdateBranch(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name string  `json:"name" binding:"required"`
		Code *string `json:"code"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "name is required"})
		return
	}

	branch, err := queryUpdateBranch(db, id, req.Name, req.Code)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "branch": branch})
}

func adminDeleteBranch(c *gin.Context) {
	id := c.Param("id")
	if err := queryDeleteBranch(db, id); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(204, nil)
}

func adminGetStaff(c *gin.Context) {
	staff, err := queryGetStaff(db)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if staff == nil {
		staff = []Staff{}
	}
	c.JSON(200, gin.H{"staff": staff})
}

func adminCreateStaff(c *gin.Context) {
	var req struct {
		Email    string  `json:"email" binding:"required"`
		FullName *string `json:"full_name"`
		Role     string  `json:"role" binding:"required"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "email and role are required"})
		return
	}

	staff, err := queryCreateStaff(db, req.Email, req.FullName, req.Role)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": staff.ID, "email": staff.Email, "full_name": staff.FullName, "role": staff.Role})
}

func adminGetPayments(c *gin.Context) {
	payments, err := queryGetPayments(db)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if payments == nil {
		payments = []Payment{}
	}
	c.JSON(200, gin.H{"payments": payments})
}

func adminVerifyPayment(c *gin.Context) {
	var req struct {
		PaymentID string `json:"payment_id" binding:"required"`
		Verifier  string `json:"verifier" binding:"required"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "payment_id and verifier are required"})
		return
	}

	queueNo, err := queryVerifyPayment(db, req.PaymentID, req.Verifier)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "queue_no": queueNo})
}

// Technician endpoints
func getTechnicianTasks(c *gin.Context) {
	tasks, err := queryGetTechnicianTasks(db)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if tasks == nil {
		tasks = []WorkProgress{}
	}
	c.JSON(200, gin.H{"tasks": tasks})
}

func updateTaskProgress(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string  `json:"status" binding:"required"`
		Notes  *string `json:"notes"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "status is required"})
		return
	}

	task, err := queryUpdateTaskProgress(db, id, req.Status, req.Notes)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "task": task})
}
