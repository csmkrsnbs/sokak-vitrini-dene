-- İstenen temiz kurulum için mevcut çalışma verilerini yalnızca bir kez sıfırlar.
-- Drizzle bu migration'ı kaydettikten sonra sonraki deploy'larda yeniden çalıştırmaz.
TRUNCATE TABLE
	"preview_requests",
	"free_usage_events",
	"coupon_codes",
	"payment_requests",
	"network_risk_checks";
