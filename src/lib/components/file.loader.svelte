<script lang="ts">
    import FaExclamation from 'svelte-icons/fa/FaExclamation.svelte'
    import FaCheck from 'svelte-icons/fa/FaCheck.svelte'
    import FaTimes from 'svelte-icons/fa/FaTimes.svelte'
    import {Spinner} from 'flowbite-svelte';
    
    let file :File|undefined = undefined;
    let data :ArrayBuffer = null;
    let reader :FileReader;
    
    const Empty = 0;
    const Loading = 1;
    const Success = 2;
    const Failed = 3;
    let state = Empty;
    
    function load_file()
    {
        const fileinput :HTMLInputElement = document.getElementById("fileloader") as HTMLInputElement;
        file = fileinput.files[0];

        reader = new FileReader();
        reader.addEventListener(
            "load",
            () => {
                // load finished successfully
                data = reader.result as ArrayBuffer;
                state = Success;
            },
            false
        );

        reader.addEventListener(
            "error",
            () => {
                // can't load a file
                data = null;
                state = Failed;
            },
            false
        );

        reader.addEventListener(
            "loadstart",
            () => {
                // load just started
                data = null;
                state = Loading;
            },
            false
        );

        reader.readAsArrayBuffer(file);
    }

    function clear()
    {
        if(reader && (reader.readyState == FileReader.LOADING))
            reader.abort();
        
        state = Empty;
        file = undefined;
        data = null;
    }

    export function get_name() :string
    {
        if(file)
            return file.name;
        else
            return "";
    }

    export function get_size() :number
    {
        if(file)
            return file.size;
        else
            return -1;
    }

    export function get_type() :string
    {
        if(file)
            return file.type;
        else
            return "";
    }

    export function get_data() :ArrayBuffer
    {
        return data;
    }

    export function is_selected() :boolean
    {
        if((state == Success) && (data != null))
            return true;
        else
            return false;
    }


</script>

<input id="fileloader" type="file" on:change={load_file}/>
{#if state==Failed}
    <!--span class="h-4 w-4 text-red-800"><FaExclamation/></span-->
{:else if state==Success}
    <!--span class="h-4 w-4 text-green-800"><FaCheck/></span-->
{:else if state==Loading}
    <Spinner size=4/>
{/if}

{#if state!=Empty}
    <span class="h-4 w-4 text-slate-700"><FaTimes on:click={clear}/></span>
{/if}
