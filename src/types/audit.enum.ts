export enum AuditAction {
    CREATE = 'CREATE',
    CHANGE = 'CHANGE',
    DELETE = 'DELETE',
    DELETE_HARD = 'DELETE_HARD',
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

export enum AuditSort {
    CREATEDAT = 'CREATEDAT',
    ACTION = 'ACTION',
    ENTITYTYPE = 'ENTITYTYPE'
}