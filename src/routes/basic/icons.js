
import {FaRegCalendarCheck, FaRegCalendar, FaRegFolder, FaRegClipboard, FaRegComments, FaRegFile, FaFile, FaList, FaUser, FaClipboardList} from 'svelte-icons/fa'

function getIconByLabel(label)
{
    switch(label)
    {
    case 'Folder':
        return FaRegFolder;

    case 'Clipboard':
        return FaRegClipboard;

    case 'Discussion':
        return FaRegComments;
    
    case 'Task':
        return FaRegCalendar;

    case 'TaskFinished':
        return FaRegCalendarCheck;

    case 'Note':
        return FaRegFile;

    case 'TaskList':
        return FaList;

    case 'User':
        return FaUser;

    case 'UploadedFile':
    case 'File':
        return FaFile;

    case 'TaskList':
        return FaList;

    case 'Multi':
            return FaClipboardList

    default:
        return null
    }        
}

export function getElementIcon(element)
{
    if(!element)
        return null
    else if(typeof element === 'object')
    {
        if(element.icon)
            return getIconByLabel(element.icon)
        else if (element.InIcon) 
            return getIconByLabel(element.InIcon)
        else if(element.$type)
        {
            switch(element.$type)
            {
            case 'Folder':
            case 'FolderFolder':
                return FaRegFolder

            case 'Note':
            case 'FolderNote':
            case 'TaskNote':
            case 'NoteNote':
                return FaRegFile

            case 'Task':
            case 'FolderTask':
                return FaRegCalendar;

            case 'UploadedFile':
            case 'FolderFile':
            case 'TaskFile':
                return FaFile;

            case 'TaskList':
                return FaList;

            case 'User':
                return FaUser;
            }
        }
        else
            return null;
    }
    else if(typeof element === 'string')
    {
        return getIconByLabel(element)
    }
}