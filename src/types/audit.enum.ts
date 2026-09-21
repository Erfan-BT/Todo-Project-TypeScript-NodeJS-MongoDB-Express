export enum AuditAction {
    CREATE = 'CREATE',
    CHANGE = 'CHANGE',
    DELETE = 'DELETE',
    RESTORE = 'RESTORE',

    ACTIVE = 'ACTIVE',
    DEACTIVE = 'DEACTIVE',

    CHANGE_PASSWORD = 'CHANGE_PASSWORD'
}

export enum AuditEntityType {
    USER = 'USER',
    TODO = 'TODO',
    SESSION = 'SESSION'
}