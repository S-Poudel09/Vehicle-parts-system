namespace VehicleParts.Application.Constants;

public static class AdminActivityActions
{
    public const string Login = "Login";
    public const string Logout = "Logout";
    public const string LoginFailed = "LoginFailed";
    public const string SessionStart = "SessionStart";
    public const string Create = "Create";
    public const string Update = "Update";
    public const string Delete = "Delete";
    public const string StockUpdate = "StockUpdate";
    public const string PriceChange = "PriceChange";
    public const string Approve = "Approve";
    public const string Reject = "Reject";
    public const string Fulfill = "Fulfill";
    public const string ReportGenerated = "ReportGenerated";
    public const string NotificationSent = "NotificationSent";
    public const string AccountLock = "AccountLock";
    public const string AccountUnlock = "AccountUnlock";
    public const string SaleModify = "SaleModify";
    public const string InventoryAdjust = "InventoryAdjust";
}

public static class AdminActivityModules
{
    public const string Auth = "Auth";
    public const string Parts = "Parts";
    public const string Inventory = "Inventory";
    public const string Purchases = "Purchases";
    public const string Vendors = "Vendors";
    public const string Staff = "Staff";
    public const string Users = "Users";
    public const string PartRequests = "PartRequests";
    public const string Reports = "Reports";
    public const string Notifications = "Notifications";
    public const string Sales = "Sales";
}

public static class AdminActivitySeverity
{
    public const string Info = "Info";
    public const string Warning = "Warning";
    public const string Critical = "Critical";
}
