package services

import (
	"context"
	"log"
	"time"
)

// RecurringScheduler periodically processes due recurring expenses and incomes.
// Implements the Scheduler interface.
type RecurringScheduler struct {
	expenseService RecurringExpenseService
	incomeService  RecurringIncomeService
	interval       time.Duration
	stopChan       chan struct{}
}

// NewRecurringScheduler creates a new instance of RecurringScheduler.
func NewRecurringScheduler(
	expenseService RecurringExpenseService,
	incomeService RecurringIncomeService,
	interval time.Duration,
) *RecurringScheduler {
	return &RecurringScheduler{
		expenseService: expenseService,
		incomeService:  incomeService,
		interval:       interval,
		stopChan:       make(chan struct{}),
	}
}

// Start begins the recurring processing loop in a non-blocking goroutine.
func (s *RecurringScheduler) Start(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(s.interval)
		defer ticker.Stop()

		for {
			select {
			case <-s.stopChan:
				return
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.runCycle(ctx)
			}
		}
	}()
}

// Stop terminates the scheduler loop gracefully.
func (s *RecurringScheduler) Stop() {
	select {
	case <-s.stopChan:
		// already closed
	default:
		close(s.stopChan)
	}
}

// runCycle executes one evaluation cycle for both due expenses and incomes.
func (s *RecurringScheduler) runCycle(ctx context.Context) {
	expCount, err := s.expenseService.ProcessAllDueExpenses(ctx)
	if err != nil {
		log.Printf("[Scheduler] Error processing recurring expenses: %v\n", err)
	} else if expCount > 0 {
		log.Printf("[Scheduler] Automatically processed %d due recurring expenses.\n", expCount)
	}

	incCount, err := s.incomeService.ProcessAllDueIncomes(ctx)
	if err != nil {
		log.Printf("[Scheduler] Error processing recurring incomes: %v\n", err)
	} else if incCount > 0 {
		log.Printf("[Scheduler] Automatically processed %d due recurring incomes.\n", incCount)
	}
}
