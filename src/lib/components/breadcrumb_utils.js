
export function breadcrumbAdd(path, name, href)
{
    if(path.length > 0)
        path += ';'
    path += `${encodeURIComponent(href)}!${encodeURIComponent(breadcrumbClipName(name))}`
    return path
}

export function breadcrumbParse(path)
{
    let segments = []
    const segs = path.split(';')
    segs.forEach(s => {
        const nidx = s.indexOf('!')
        segments.push({
            href: decodeURIComponent( s.substring(0, nidx) ),
            name: decodeURIComponent( s.substring(nidx+1))
        })
    })

    return segments;
}

export function breadcrumbStringify(segments)
{
    let result = ''
    segments.forEach(s => {

        if(result.length > 0)
            result += ";";
        result += `${encodeURIComponent(s.href)}!${encodeURIComponent(breadcrumbClipName(s.name))}`
    })

    return result;
}

export function breadcrumbClipName(name)
    {
        const maxNameLen = 24;
        if(name.length > maxNameLen)
            return name.substr(0, maxNameLen-3) + "..."
        else
            return name;
    }