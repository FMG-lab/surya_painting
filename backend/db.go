package main

import (
	"database/sql"
	"time"
)

// Models
type Branch struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Code      *string   `json:"code"`
	CreatedAt time.Time `json:"created_at"`
}

type Booking struct {
	ID            string    `json:"id"`
	GuestName     *string   `json:"guest_name"`
	GuestPhone    *string   `json:"guest_phone"`
	BranchID      *string   `json:"branch_id"`
	BookingToken  *string   `json:"booking_token"`
	Status        *string   `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type Payment struct {
	ID        string    `json:"id"`
	BookingID *string   `json:"booking_id"`
	Amount    *int      `json:"amount"`
	ProofPath *string   `json:"proof_path"`
	Status    *string   `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type WorkProgress struct {
	ID        string    `json:"id"`
	BookingID *string   `json:"booking_id"`
	AssignedTo *string  `json:"assigned_to"`
	Status    *string   `json:"status"`
	Notes     *string   `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  *string   `json:"full_name"`
	Role      *string   `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Staff struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  *string   `json:"full_name"`
	Role      *string   `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type PaymentBank struct {
	Code      string `json:"code"`
	Name      string `json:"name"`
	Alias     string `json:"alias"`
	SwiftCode string `json:"swift_code"`
}

// Database Queries
func queryGetBranches(database *sql.DB) ([]Branch, error) {
	rows, err := database.Query("SELECT id, name, code, created_at FROM branches ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var branches []Branch
	for rows.Next() {
		var b Branch
		if err := rows.Scan(&b.ID, &b.Name, &b.Code, &b.CreatedAt); err != nil {
			return nil, err
		}
		branches = append(branches, b)
	}
	return branches, rows.Err()
}

func queryGetBranch(database *sql.DB, id string) (*Branch, error) {
	var b Branch
	err := database.QueryRow("SELECT id, name, code, created_at FROM branches WHERE id = $1", id).
		Scan(&b.ID, &b.Name, &b.Code, &b.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

func queryCreateBranch(database *sql.DB, name string, code *string) (*Branch, error) {
	var b Branch
	err := database.QueryRow(
		"INSERT INTO branches (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at",
		name, code,
	).Scan(&b.ID, &b.Name, &b.Code, &b.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func queryUpdateBranch(database *sql.DB, id string, name string, code *string) (*Branch, error) {
	var b Branch
	err := database.QueryRow(
		"UPDATE branches SET name = $1, code = $2 WHERE id = $3 RETURNING id, name, code, created_at",
		name, code, id,
	).Scan(&b.ID, &b.Name, &b.Code, &b.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func queryDeleteBranch(database *sql.DB, id string) error {
	_, err := database.Exec("DELETE FROM branches WHERE id = $1", id)
	return err
}

// Bookings
func queryCreateBooking(database *sql.DB, guestName, guestPhone *string, branchID *string) (*Booking, error) {
	var book Booking
	err := database.QueryRow(
		"INSERT INTO bookings (guest_name, guest_phone, branch_id, status) VALUES ($1, $2, $3, 'pending') RETURNING id, guest_name, guest_phone, branch_id, booking_token, status, created_at",
		guestName, guestPhone, branchID,
	).Scan(&book.ID, &book.GuestName, &book.GuestPhone, &book.BranchID, &book.BookingToken, &book.Status, &book.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &book, nil
}

func queryGetBookingStatus(database *sql.DB, code string) (*Booking, error) {
	var book Booking
	err := database.QueryRow(
		"SELECT id, guest_name, guest_phone, branch_id, booking_token, status, created_at FROM bookings WHERE booking_token = $1",
		code,
	).Scan(&book.ID, &book.GuestName, &book.GuestPhone, &book.BranchID, &book.BookingToken, &book.Status, &book.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &book, nil
}

func queryGetBookings(database *sql.DB) ([]Booking, error) {
	rows, err := database.Query("SELECT id, guest_name, guest_phone, branch_id, booking_token, status, created_at FROM bookings ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []Booking
	for rows.Next() {
		var b Booking
		if err := rows.Scan(&b.ID, &b.GuestName, &b.GuestPhone, &b.BranchID, &b.BookingToken, &b.Status, &b.CreatedAt); err != nil {
			return nil, err
		}
		bookings = append(bookings, b)
	}
	return bookings, rows.Err()
}

// Payments
func queryGetPayments(database *sql.DB) ([]Payment, error) {
	rows, err := database.Query("SELECT id, booking_id, amount, proof_path, status, created_at FROM payments ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []Payment
	for rows.Next() {
		var p Payment
		if err := rows.Scan(&p.ID, &p.BookingID, &p.Amount, &p.ProofPath, &p.Status, &p.CreatedAt); err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, rows.Err()
}

func queryVerifyPayment(database *sql.DB, paymentID string, verifier string) (int, error) {
	var queueNo int
	err := database.QueryRow("SELECT verify_payment($1, $2)", paymentID, verifier).Scan(&queueNo)
	if err != nil {
		return 0, err
	}
	return queueNo, nil
}

func queryGetPaymentBanks() []PaymentBank {
	return []PaymentBank{
		{Code: "BCA", Name: "Bank Central Asia", Alias: "bca", SwiftCode: "BCAIIDJA"},
		{Code: "BNI", Name: "Bank Negara Indonesia", Alias: "bni", SwiftCode: "BNIAIDJA"},
		{Code: "MANDIRI", Name: "Bank Mandiri", Alias: "mandiri", SwiftCode: "BMRIIDJA"},
		{Code: "CIMB", Name: "CIMB Niaga", Alias: "cimb", SwiftCode: "BNIAIDJA"},
	}
}

// Staff/Users
func queryGetStaff(database *sql.DB) ([]Staff, error) {
	rows, err := database.Query("SELECT id, email, full_name, role, created_at FROM private.users WHERE role IN ('manager', 'technician') ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var staff []Staff
	for rows.Next() {
		var s Staff
		if err := rows.Scan(&s.ID, &s.Email, &s.FullName, &s.Role, &s.CreatedAt); err != nil {
			return nil, err
		}
		staff = append(staff, s)
	}
	return staff, rows.Err()
}

func queryCreateStaff(database *sql.DB, email string, fullName *string, role string) (*Staff, error) {
	var s Staff
	err := database.QueryRow(
		"INSERT INTO private.users (id, email, full_name, role) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id, email, full_name, role, created_at",
		email, fullName, role,
	).Scan(&s.ID, &s.Email, &s.FullName, &s.Role, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// Technician Tasks
func queryGetTechnicianTasks(database *sql.DB) ([]WorkProgress, error) {
	rows, err := database.Query("SELECT id, booking_id, assigned_to, status, notes, created_at FROM work_progress ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []WorkProgress
	for rows.Next() {
		var wp WorkProgress
		if err := rows.Scan(&wp.ID, &wp.BookingID, &wp.AssignedTo, &wp.Status, &wp.Notes, &wp.CreatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, wp)
	}
	return tasks, rows.Err()
}

func queryUpdateTaskProgress(database *sql.DB, taskID string, status string, notes *string) (*WorkProgress, error) {
	var wp WorkProgress
	err := database.QueryRow(
		"UPDATE work_progress SET status = $1, notes = $2 WHERE id = $3 RETURNING id, booking_id, assigned_to, status, notes, created_at",
		status, notes, taskID,
	).Scan(&wp.ID, &wp.BookingID, &wp.AssignedTo, &wp.Status, &wp.Notes, &wp.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &wp, nil
}
