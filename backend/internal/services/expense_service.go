package services

import (
	"context"
	"strings"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type expenseService struct {
	repo    repository.ExpenseRepository
	catRepo repository.CategoryRepository
}

func NewExpenseService(repo repository.ExpenseRepository, catRepos ...repository.CategoryRepository) ExpenseService {
	var catRepo repository.CategoryRepository
	if len(catRepos) > 0 {
		catRepo = catRepos[0]
	}
	return &expenseService{repo: repo, catRepo: catRepo}
}

func (s *expenseService) GetExpenses(ctx context.Context, userID string) ([]models.Expense, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *expenseService) CreateExpense(ctx context.Context, userID string, expense *models.Expense) (*models.Expense, error) {
	if expense.ID == "" {
		expense.ID = GenerateShortID("exp_")
	}
	expense.UserID = userID
	if expense.Currency == "" {
		expense.Currency = "USD"
	}
	if expense.Description == "" {
		expense.Description = "Gasto automatizado"
	}

	// 1. Resolve Category ID or Name
	catInput := strings.TrimSpace(expense.CategoryID)
	if catInput == "" {
		catInput = strings.TrimSpace(expense.Category)
	}

	if catInput != "" {
		resolvedDefault := models.ResolveDefaultCategoryName(catInput, "expense")
		if resolvedDefault != "" {
			expense.Category = resolvedDefault
		} else if s.catRepo != nil {
			// Look up custom category by ID belonging to this user
			customCat, err := s.catRepo.FindByIDAndUserID(ctx, catInput, userID)
			if err == nil && customCat != nil {
				expense.Category = customCat.Name
			} else {
				// Look up custom category by name belonging to this user
				customByName, err := s.catRepo.FindByNameAndType(ctx, userID, catInput, "expense")
				if err == nil && customByName != nil {
					expense.Category = customByName.Name
				} else {
					expense.Category = catInput
				}
			}
		} else {
			expense.Category = catInput
		}
	} else {
		expense.Category = InferExpenseCategory(expense.Description)
	}

	// 2. Resolve Payment Method ID or Name
	pmInput := strings.TrimSpace(expense.PaymentMethodID)
	if pmInput == "" {
		pmInput = strings.TrimSpace(expense.PaymentMethod)
	}
	if pmInput != "" {
		expense.PaymentMethod = models.ResolvePaymentMethodName(pmInput)
	} else {
		expense.PaymentMethod = "Automático (API)"
	}

	if expense.Date.IsZero() {
		expense.Date = time.Now()
	}
	if err := s.repo.Create(ctx, expense); err != nil {
		return nil, err
	}
	return expense, nil
}

// InferExpenseCategory automatically maps common keywords in expense descriptions to FinTrack categories.
func InferExpenseCategory(description string) string {
	d := strings.ToLower(description)

	// Food / Alimentación
	foodKeywords := []string{
		"restaurante", "comida", "almuerzo", "cena", "desayuno", "café", "cafe",
		"starbucks", "uber eats", "ubereats", "didi food", "didifood", "rappi",
		"mcdonald", "burger", "pizza", "supermercado", "super", "walmart",
		"automercado", "masxmenos", "palí", "pali", "pulperia", "panaderia",
		"panadería", "sushi", "tacos", "carniceria", "verdulería", "snack",
	}
	for _, kw := range foodKeywords {
		if strings.Contains(d, kw) {
			return models.CategoryAlimentacion
		}
	}

	// Transport / Transporte
	transportKeywords := []string{
		"uber", "didi", "taxi", "gasolina", "combustible", "gasolinera", "peaje",
		"estacionamiento", "parqueo", "bus", "pasaje", "metro", "tren",
		"avianca", "vuelo", "avion", "aeropuerto", "mecanico", "taller",
	}
	for _, kw := range transportKeywords {
		if strings.Contains(d, kw) {
			return models.CategoryTransporte
		}
	}

	// Services / Servicios
	serviceKeywords := []string{
		"luz", "electricidad", "agua", "internet", "telefono", "teléfono", "celular",
		"kolbi", "liberty", "claro", "tigo", "cable", "recarga", "ice", "aya", "enel",
		"alquiler", "renta", "condominio", "seguro", "mantenimiento",
	}
	for _, kw := range serviceKeywords {
		if strings.Contains(d, kw) {
			return models.CategoryServicios
		}
	}

	// Entertainment / Entretenimiento
	entertainmentKeywords := []string{
		"cine", "pelicula", "netflix", "spotify", "youtube", "hbo", "max", "disney",
		"prime video", "apple tv", "steam", "playstation", "xbox", "nintendo",
		"concierto", "fiesta", "bar", "cerveza", "vino", "hotel", "paseo",
	}
	for _, kw := range entertainmentKeywords {
		if strings.Contains(d, kw) {
			return models.CategoryEntretenimiento
		}
	}

	// Health / Salud
	healthKeywords := []string{
		"farmacia", "fischel", "fishel", "bomba", "sucre", "doctor", "doctora",
		"medico", "médico", "medicina", "medicamento", "hospital", "clinica", "clínica",
		"odontologo", "dentista", "lentes", "optica", "óptica", "psicologo", "terapia",
	}
	for _, kw := range healthKeywords {
		if strings.Contains(d, kw) {
			return models.CategorySalud
		}
	}

	return models.CategoryOtros
}

func (s *expenseService) UpdateExpense(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error) {
	return s.repo.Update(ctx, id, userID, expense)
}

func (s *expenseService) DeleteExpense(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}
