<script lang="ts">
    import Page from '../../lib/page.svelte'
    import Table from '../../lib/components/table/table.svelte'
    import TableColumn from '../../lib/components/table/column.svelte'
    import Icon from '../../lib/components/icon.svelte'
    import FaRegCheckCircle from 'svelte-icons/fa/FaRegCheckCircle.svelte'
    import FaRegCircle from 'svelte-icons/fa/FaRegCircle.svelte'
    import FaPlus from 'svelte-icons/fa/FaPlus.svelte'
	import Operations from '$lib/operations.svelte';
    import Fab from '$lib/components/Fab.svelte'


    let table;

    let current_list = {
        Tasks:[
            {
                IsFinished: false,
                Name:   'Bread'
            },
            {
                IsFinished: false,
                Name:   'Butter'
            },
            {
                IsFinished: false,
                Name:   'Milk'
            },
            {
                IsFinished: false,
                Name:   'Cream'
            },
            {
                IsFinished: false,
                Name:   'Eggs'
            }
        ]
    }

    let task_operations = [
        {
            icon: FaRegCheckCircle,
            caption: 'Finish',
            action: (focused) => { console.log('task id:', focused.Id, 'Finish action') }
        },
        {
            icon: FaPlus,
            caption: 'Move'
        },
        {
            icon: FaPlus,
            caption: 'Rename'
        }
    ]

    let page_operations = [
        {
            icon: FaPlus,
            caption: 'Add',
            action: (focused) => { console.log('focused:', focused) }
        }
    ]

    let menuOperations = [
        {
            caption: 'Finish',
            icon: FaRegCheckCircle,
            action: (focused) => { console.log('task id:', focused.Id, 'Finish action') }
        },
        {
            separator: true
        },
        {
            caption: 'Move'
        },
        {
            caption: 'Rename'
        },
        {
            caption: 'More',
            menu:[
                {
                    caption: 'Finish',
                    icon: FaRegCheckCircle,
                    action: (focused) => { console.log('task id:', focused.Id, 'Finish action') }
                },
                {
                    caption: 'Move'
                },
                {
                    caption: 'Rename'
                },
                {
                    caption: 'More',
                    menu:[
                        {
                            caption: 'Finish',
                            icon: FaRegCheckCircle,
                            action: (focused) => { console.log('task id:', focused.Id, 'Finish action') }
                        },
                        {
                            caption: 'Move'
                        },
                        {
                            caption: 'Rename'
                        }
                    ]
                }
            ]
        }
    ]


    function finish_task(event, item)
    {
        item.IsFinished = !item.IsFinished
    }

</script>


<a href="/" class="underline text-sm font-semibold ml-3"> &lt; Back to root</a>


<div  class="w-screen h-[40px] 
            sm:left-[40px] sm:top-0 sm:w-[calc(100vw-40px)]    
            
            z-0 overflow-hidden " >
    <Operations/>
</div>

<div class="fixed right-3 bottom-0 mb-1 cursor-pointer z-10">
    <Fab/>
</div>


<Page   self={current_list} cl="!bg-white dark:!bg-stone-900 w-full h-full flex flex-col overflow-y-hidden overflow-x-hidden py-1 px-1 border-0" 
        toolbarOperations={page_operations}
        clearsContext='sel'>
    
    <Table collection='Tasks' bind:this={table} toolbarOperations={task_operations} {menuOperations}>
        <TableColumn size={5}/>
            <Icon   slot='c0' 
                    let:item 
                    size={4} 
                    component={(item.IsFinished) ? FaRegCheckCircle : FaRegCircle} 
                    on:click={async (event) => { await finish_task(event, item); }} 
                    class="cursor-pointer"/>

        <TableColumn field='Name' />
        <TableColumn />
            <div slot='c2' class="bg-stone-100">
                ala
            </div>

    </Table>
    
</Page>