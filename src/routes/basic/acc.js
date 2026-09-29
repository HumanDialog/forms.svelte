import {ACC_UNKNOWN, ACC_CALCULATING, ACC_USER, ACC_USER_RESTRICTED, ACC_USER_CONFIDENTIAL, ACC_USER_SHARED, ACC_EXT_USER_SHARED, ACC_GROUP_RESTRICTED, ACC_GROUP_CONFIDENTIAL, ACC_GROUP, ACC_GROUP_PUBLISHED, ACC_GROUP_SHARED, ACC_PUBLIC} from './consts'

export function get_acc_icon(acc_code)
{
    switch(acc_code)
    {
        case ACC_UNKNOWN:
            return 'building';
        case ACC_USER:
            return 'lock-keyhole'
        case ACC_USER_CONFIDENTIAL:
            return 'lock-keyhole'
        case ACC_USER_SHARED:
            return 'lock-keyhole'
        case ACC_GROUP_CONFIDENTIAL:
            return 'lock'
        case ACC_GROUP:
            return 'lock'
        case ACC_GROUP_PUBLISHED:
            return 'lock'
        case ACC_GROUP_SHARED:
            return 'lock'
        case ACC_PUBLIC:
            return 'shared'
    }
}

export function get_acc_color(acc_code)
{
    switch(acc_code)
    {
        case ACC_UNKNOWN:
            return 'text-gray-500';
        case ACC_USER:
            return 'text-amber-500'
        case ACC_USER_CONFIDENTIAL:
            return 'text-red-500'
        case ACC_USER_SHARED:
            return 'text-orange-500'
        case ACC_GROUP_CONFIDENTIAL:
            return 'text-green-500'
        case ACC_GROUP:
            return 'text-sky-500'
        case ACC_GROUP_PUBLISHED:
            return 'text-indigo-500'
        case ACC_GROUP_SHARED:
            return 'text-purple-500'
        case ACC_PUBLIC:
            return 'text-lime-500'
    }
}