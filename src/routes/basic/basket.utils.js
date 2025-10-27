import {reef} from '@humandialog/auth.svelte'
import { onErrorShowAlert } from '$lib';

export async function fetchClipboardElements()
{
    let res = await reef.post(`/user/Clipboards/first/query`,
                            {
                                Id: 1,
                                Name: '',
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Id', '$ref','Title'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Elements',
                                                Sort: "Order",
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', 'ElementId', 'ElementType', 'ElementNav', 'ElementInfo']
                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);
    
    if(!res)
        return []
    
    const clipboardItem = res.Clipboard;
    if(!clipboardItem)
        return []
    
    if(Object.keys(clipboardItem).length == 0)
        return []

    return [...clipboardItem.Elements]
}

const EIF_ITEM              =  0x00000000
const EIF_CUT               =  0x00000001
const EIF_BEGIN_GROUP       =  0x00000100
const EIF_END_GROUP         =  0x00000200
const EIF_NOT_ALLOWED       =  0x10000000

export async function fetchComposedClipboard4Folder()
{
    return await fetchComposedClipboard(['Folder', 'Note', 'Task', 'UploadedFile'])
}

export async function fetchComposedClipboard4TaskList()
{
    return await fetchComposedClipboard(['Task'])
}

export async function fetchComposedClipboard4Task()
{
    return await fetchComposedClipboard(['Note', 'UploadedFile'])
}

export async function fetchComposedClipboard4Note()
{
    return await fetchComposedClipboard(['Note', 'UploadedFile'])
}

export async function fetchComposedClipboard4Message()
{
    return await fetchComposedClipboard(['Note', 'Task', 'UploadedFile'])
}

export async function fetchComposedClipboard4Editor()
{
    return await fetchComposedClipboard([]) // all allowed
}

export async function fetchComposedClipboard(allowedTypes)
{
    const allElements = await fetchClipboardElements()
    if(allElements.length == 0)
        return []

    let composedElements = []
    const elementsNo = allElements.length
    for(let i=0; i<elementsNo; i++)
    {
        const element = allElements[i]
        if(element.ElementInfo & EIF_BEGIN_GROUP)
        {
            const beginGroup = element
            beginGroup.groupItems = []
            i++             // skip begin group
            for(; i<elementsNo; i++)
            {
                const groupElement = allElements[i]
                if(groupElement.ElementInfo & EIF_END_GROUP)
                    break;

                collectElement(beginGroup.groupItems, groupElement, allowedTypes)
            }
            //i++             // skip end group

            const allowedElements = beginGroup.groupItems.filter( (e) => (e.ElementInfo & EIF_NOT_ALLOWED) == 0)
            
            if(allowedElements.length == 0)
                beginGroup.ElementInfo |= EIF_NOT_ALLOWED

            //todo: beginGroup.Title = 'Multiple elements: ' + allowedElements.length
            composedElements.push(beginGroup)
            
        }
        else
            collectElement(composedElements, element, allowedTypes)
    }

    return composedElements
}

function collectElement(composedElements, element, allowedTypes)
{
    if((allowedTypes.length > 0) && (allowedTypes.findIndex((allowed) => allowed == element.ElementType) < 0))
        element.ElementInfo |= EIF_NOT_ALLOWED

    composedElements.push(element)
}

export function recentClipboardElements(selectedElements)
{
    let refs = []
    selectedElements.forEach((el) => refs.push(el.$ref))

    reef.post('user/Clipboards/first/SetRecentElements', {refs: refs}, onErrorShowAlert)
}

export function transformClipboardToJSONReferences(selectedReferences)
{
    let references = []
    selectedReferences.forEach(el => {
        if(el.ElementInfo & EIF_BEGIN_GROUP)
        {
            if(el.groupItems && Array.isArray(el.groupItems) && el.groupItems.length > 0)
            {
                el.groupItems.forEach((gi) => {
                    references.push({
                            id:         gi.ElementId,
                            typeName:   gi.ElementType,
                            navPath:    gi.ElementNav,
                            Title:      gi.Title,
                            Summary:    gi.Summary,
                            icon:       gi.icon,
                            href:       gi.href, 
                            flags:      gi.ElementInfo
                        })   
                })
            }
        }
        else
            references.push({
                id:         el.ElementId,
                typeName:   el.ElementType,
                navPath:    el.ElementNav,
                Title:      el.Title,
                Summary:    el.Summary,
                icon:       el.icon,
                href:       el.href, 
                flags:      el.ElementInfo
            })
    })

    return references
}