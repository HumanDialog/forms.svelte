<script>
    import {reef} from '@humandialog/auth.svelte'
    import {Spinner, onErrorShowAlert, download_file_from_href} from '$lib'
    import {FaFile} from 'svelte-icons/fa/'

    export let self;
    export let a;
    export let fileInfo;


    function getNiceFileName(fileName)
    {
        let prefix
        
        if(self.$type && self.Id)
            prefix = `${self.$type}_${self.Id}_${a}_`;
        else if(self.$ref)
        {
            const segments = self.$ref.split('/')
            if(segments.length == 3)
                prefix = `${segments[1]}_${segments[2]}_${a}_`;
            else
                return fileName;
        }
        else
            return fileName;

        if(fileName.startsWith(prefix))
        {
            return fileName.substr(prefix.length)   
        }
        else
            return fileName;
    }

    async function onDownloadFile(e, file)
    {
        e.preventDefault();
        e.stopPropagation();

        file.downloading = true;

        const href=`${self.$ref}/${a}/blob?key=${file.name}`
        const name = getNiceFileName(decodeURIComponent(file.name))

        await download_file_from_href(href, name)

        file.downloading = false;
    }

</script>

<a href="#" download
    on:click={(e) => onDownloadFile(e, fileInfo)}
    class="mr-2 font-normal text-nowrap break-normal">
    {#if fileInfo.downloading}
        <Spinner size={3} delay={0}/>
    {:else}
        <span class="inline-block w-3 h-3"><FaFile/></span>
    {/if}
    {getNiceFileName(decodeURIComponent(fileInfo.name))}
</a>