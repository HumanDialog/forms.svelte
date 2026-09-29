
export const STATUS_ACTIVE     =  0
export const STATUS_ARCHIVED   =  1
export const STATUS_HIDDEN     =  2
export const STATUS_DELETED    =  3
export const STATUS_TEMPLATE   =  8


export const NK_DOCUMENT          = 0
export const NK_THREAD            = 1
export const NK_COMMENT           = 2 

export const NR_NONE               = 0
export const NR_DESCRIPTION        = 1
export const NR_COVER              = 2
export const NR_COMMENT            = 3
export const NR_SCRATCH            = 4
export const NR_DRAFT              = 5

export const NS_SCRATCH           = 950
export const NS_DRAFT             = 1000
export const NS_LATEST            = 1500
export const NS_CONFIDENTIAL      = 2000
export const NS_REVIEWED          = 3000
export const NS_PUBLIC            = 4000

export const FK_FOLDER             = 0
export const FK_BASKET             = 1
export const FK_DISCUSSION         = 2
export const FK_TABLE              = 3
export const FK_DOCUMENT           = 4
export const FK_FEED               = 5


export const STATE_UNSPECIFIED       = 0
export const STATE_IN_PREPARATION    = 1000
export const STATE_PLANNED           = 2000
export const STATE_READY             = 3000
export const STATE_EXECUTING         = 4000
export const STATE_FINISHED          = 7000
export const STATE_CLOSED            = 8000
export const STATE_ARCHIVED          = 9000

export const ACC_DENIED             = 0
export const ACC_READ               = 1
export const ACC_WRITE              = 2
export const ACC_READWRITE          = 3

export const ACC_UNKNOWN           =   0
export const ACC_CALCULATING       =   1
export const ACC_USER              =   1000
export const ACC_USER_RESTRICTED   =   1100
export const ACC_USER_CONFIDENTIAL =   1200
export const ACC_USER_SHARED       =   2000
export const ACC_EXT_USER_SHARED   =   2500
export const ACC_GROUP_RESTRICTED  =   2800
export const ACC_GROUP_CONFIDENTIAL =  2900
export const ACC_GROUP             =   3000
export const ACC_GROUP_PUBLISHED   =   3100
export const ACC_GROUP_SHARED      =   7000
export const ACC_PUBLIC            =   9000