export enum AuditAction {
    CREATE = 'CREATE',
    CHANGE = 'CHANGE',
    DELETE = 'DELETE',

    CHANGE_EMAIL = 'CHANGE_EMAIL',
    CHANGE_PASSWORD = 'CHANGE_PASSWORD'
}

export enum AuditEntityType {
    USER = 'USER',
    TODO = 'TODO',
    SESSION = 'SESSION'
}