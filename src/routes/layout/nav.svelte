<script >
    import {Spinner, show_menu, start_editing, Sidebar, SidebarBrand, SidebarGroup, SidebarItem} from '$lib'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash} from 'svelte-icons/fa'
    import { onMount, afterUpdate } from "svelte";
    
    let tasklists = [];
    let user = {};
    let just_have_completed_lists = false;

    //$: checklists = $all_lists;

    onMount(async () => {
        
        user = {

        }
        
        tasklists = [
            {
                Id: 1,
                Name: 'Shopping List'
            },
            {
                Id: 2,
                Name: 'Movies to Watch'
            },
            {
                Id: 3,
                Name: 'Cities to Visit'
            }
        ];

        just_have_completed_lists = true;
    });

    afterUpdate(() => {
        
        if(just_have_completed_lists)
        {
            just_have_completed_lists = false;
        }
    });

    

    async function add_list(list_name)
    {
        
    }

    async function delete_list(list)
    {
        
    }

    async function change_name(list, name)
    {
        
            return true;
        
    }

    async function finish_all_on_list(list)
    {
        

    }

    async function finish_all_my_tasks()
    {
       

    }

    async function move_list_up(list)
    {
        let prev = tasklists.prev(list);
        if(!prev)
            return;

        [prev.Order, list.Order] = [list.Order, prev.Order];
        tasklists = tasklists.swap(prev, list);

       
    }

    async function move_list_down(list)
    {
        let next = tasklists.next(list);
        if(!next)
            return;

        [next.Order, list.Order] = [list.Order, next.Order]
        tasklists = tasklists.swap(list, next);

        
    }
    
    function get_user_list_operations(dom_node, data_item)
    {
        let menu_operations = [];
        
        menu_operations.push({
            caption: 'Finish all',
            icon: FaRegCheckCircle,
            action: (focused) => finish_all_my_tasks()
        });

        return menu_operations;
    }

    function get_task_list_operations(dom_node, data_item)
    {
        let menu_operations = [
            {
                caption: 'Rename',
                action: (focused) => start_editing(dom_node)
            },
            {
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (focused) => finish_all_on_list(data_item)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (focused) => move_list_up(data_item)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (focused) => move_list_down(data_item)

            },
            {
                separator: true
            },
            {
                caption: 'Delete',
                icon: FaTrash,
                action: (focused) => delete_list(data_item)
            }
        ]
        return menu_operations;
    }

   
  </script>
  
<Sidebar>
    <SidebarBrand img="https://objectreef.dev/reef.svg">
        Octopus <span class="font-thin">mini</span>
    </SidebarBrand>
        
        {#if tasklists && tasklists.length > 0}
            {@const is_active=false}
        
        <SidebarGroup>
            <SidebarItem   href="#/mytasks"
                            icon={FaList}
                            active={is_active}
                            operations={(node) => get_user_list_operations(node, user)}
                            selectable={user}>
                My Tasks
            </SidebarItem>
        </SidebarGroup>

        <SidebarGroup border inserter={add_list} inserter_placeholder='New list'>
            {#each tasklists as list (list.Id)}
                {@const href = `#/tasklist/${list.Id}`}
                {@const is_active = false}
                <SidebarItem   {href}
                                icon={FaList}
                                active={is_active}
                                operations={(node) => get_task_list_operations(node, list)}
                                selectable={list}
                                editable={(text) => {change_name(list, text)}}>
                    {list.Name}
                </SidebarItem>
            {/each }
            
        </SidebarGroup>
        
        {:else}
            <Spinner delay={3000}/>
        {/if}

    </Sidebar>



    
