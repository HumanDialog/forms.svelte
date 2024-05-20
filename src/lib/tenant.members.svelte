<script>
    import {    FaUserPlus,
                FaUserMinus,
                FaPen,
                FaInfoCircle} from 'svelte-icons/fa'
    
    import Page from './page.svelte'
    import List from './components/list/list.svelte'
    import ListTitle from './components/list/list.title.svelte'
    import ListSummary from './components/list/list.summary.svelte'
    import ListComboProperty from './components/list/list.combo.svelte'
    import ComboItem from './components/combo/combo.item.svelte'
    import ListStaticProperty from './components/list/list.static.svelte'
    import Input from './components/inputbox.ltop.svelte';
    import Icon from "./components/icon.svelte";
	import Modal from './modal.svelte'
	import Checkbox from '$lib/components/checkbox.svelte';
    import {Popover} from 'flowbite-svelte'
	import { reef } from '@humandialog/auth.svelte';
	

    // ==============================================================================

    export let users = undefined;
    export let nameAttrib = "Name";
    export let emailAttrib = "login";
    export let refAttrib = "$ref";
    export let showFiles = false;
    //export let show_admin = true;
    export let appGroups = undefined;

    // ===============================================================================
  
    $: init();
   
    // ===============================================================================

	let list;

    let create_new_user_enabled = false;

    let reef_users = [];
    let new_reef_user_id = 1;

    let fake_users;

    async function init()
    {
        reef_users = [];
        if(users && Array.isArray(users) && users.length > 0)
        {
            users.forEach( u =>
            {
                reef_users.push(
                    {
                        Id: new_reef_user_id++,
                        [nameAttrib]: u[nameAttrib],
                        [emailAttrib]: u[emailAttrib],
                        [refAttrib]: u[refAttrib],
                        auth_group: 0,
                        files_group :0,
                        app_group: 0,
                        other: "",
                        avatar_url : "",
                        invitation_not_accepted: false,
                        removed: false,
                        membership_tag: ""
                    }
                )
            })
        }

        //fake_users = [];
        //add_fake_users(fake_users);

        await fetch_details();
 
    }

    
    async function fetch_details(...args)
    {
        let users_no = reef_users.length;
        let handled_no = 0;
        reef_users.forEach(async ru =>
        {
            let details = await reef.get(`/sys/user_details?email=${ru[emailAttrib]}`)
            set_user_info(ru, details);

            handled_no++;
            if(handled_no == reef_users.length)
            {
                //console.log('reload', reef_users)
                
                list?.reload(reef_users);
            }
        } )
    }

    function set_user_info(user, info)
    {
        user.auth_group = info.auth_group ?? 0;
        user.files_group = info.files_group ?? 0;
        user.avatar_url = info.avatar_url ?? "";
        user.other = info.access_details ?? "";
        user.app_group = info.reef_user_group_id ?? 0;
        user.removed = info.removed ?? false;
        user.invitation_not_accepted = info.invitation_not_accepted ?? false;

        if(user.removed)
            user.membership_tag = "Removed";
        else if(user.invitation_not_accepted)
            user.membership_tag = "Invited";
        else
            user.membership_tag = "";

        user.Id = new_reef_user_id++;
    }

    /*onMount(
        async () => {
            await fetch_details();
            return () => {}
        }
    )
    */
    
    let new_user = {
        name: '',
        email: '',
        maintainer: false
    }

    let name_input;
    let email_input;

    async function delete_user(user)
    {
        let email = user[emailAttrib];
        
        let removed_user_details = await reef.get('/sys/kick_out_user?email=' + email);
        if(removed_user_details)
        {
            //let removed_user = reef_users.find( u => u[emailAttrib] == user[emailAttrib])
            set_user_info(user, removed_user_details);
            list?.refresh();
        }
    }

    async function on_name_changed(user, name, property)
    {
        user[property] = name;

        let user_path = user[refAttrib];
        if(!user_path)
            return;

        await reef.post(`${user_path}/set`,
                    {
                        [nameAttrib]: name
                    }); 
    }

    async function on_change_privileges(user, flags, name)
    {
        if(user.auth_group != flags)
        {
            let email = user[emailAttrib];
            let info = await reef.get(`sys/set_user_details?email=${email}&auth_group=${flags}`)
            if(info)
            {
                user.auth_group = flags;

                set_user_info(user, info)
                list?.refresh();
            }
        }
    }

    async function on_change_files_access(user, flags, name)
    {
        if(user.files_group != flags)
        {
            user.files_group = flags;
            
            let email = user[emailAttrib];
            let info = await reef.get(`sys/set_user_details?email=${email}&files_group=${flags}`)
            if(info)
            {
                set_user_info(user, info)
                list?.refresh();
            }
        }
    }
    
    function create_new_user()
    {
        create_new_user_enabled = true;
    }

    let page_operations=[
        {
            icon: FaUserPlus,
            caption: '',
            action: (focused) => { create_new_user(); }
        }
    ]

    function get_edit_operations(user)
    {
        let operations = [
            {
                caption: nameAttrib,
                action: (focused) =>  { list.edit(user, nameAttrib) }
            },
            {
                caption: 'Privileges',
                action: (focused) => { list.edit(user, 'Privileges') }
            }];

        if(showFiles)
        {
            operations.push({
                caption: 'Files',
                action: (focused) => { list.edit(user, 'Files') }
            });
        }
        
        return operations;
    }

    let user_operations = (user) => { 
        
        let operations = [];
        
        let edit_operations = get_edit_operations(user)
        if(edit_operations.length == 1)
        {
            operations.push({
                                icon: FaPen,
                                caption: '',
                                action: edit_operations[0].action
                            });
        }
        else
        {
            operations.push({
                                icon: FaPen,
                                caption: '',
                                grid: edit_operations
                            });
        }

        operations.push({
                            caption: '',
                            icon: FaUserMinus,
                            action: (focused) => delete_user(user)
                        });

        return operations;
    }

    let user_context_menu = (user) => {
        let edit_operations = get_edit_operations(user);
        return {
            grid: edit_operations
        }
    }

    let data_item = 
    { 
       
    }

    function is_valid_email_address(e)
    {
        //let pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        //return (e.match(pattern) != null);

        var at_idx = e.indexOf("@"); 
        var dot_idx = e.lastIndexOf("."); 
        var space_idx = e.indexOf(" "); 

        if ((at_idx != -1) && 
            (at_idx != 0) && 
            (dot_idx != -1) && 
            (dot_idx != 0) && 
            (dot_idx > at_idx + 1) && 
            (e.length > dot_idx + 1) && 
            (space_idx == -1)) 
        { 
            return true; 
        } 
        else 
        { 
            return false; 
        } 
        
    }

    function is_valid_name(s)
    {
        return !!s;
    }

    function add_fake_users(reef_users)
    {
        const names = [
            "Evangeline Burnett",
            "Veronica Shaffer",
            "Evan Moyer",
            "Maisey Knox",
            "Princess Taylor",
            "Lilli Brown",
            "Celine Terrell",
            "Alexander Simmons",
            "Leslie Rowland",
            "Amira Reeves",
            "Remi Parks",
            "Daniela Holder",
            "Sonny Watkins",
            "Kiran Patton",
            "Nadia O'Brien",
            "Aine Lyons",
            "Arran Mccoy",
            "Aliya Hart",
            "Zara Ross",
            "Chad Ramirez",
            "Aron Briggs",
            "Nicole Hall",
            "Mitchell Hendricks",
            "Lila Chandler",
            "Carter Padilla",
            "Christian Thompson",
            "Ishaq Smith",
            "Sofia Blanchard",
            "Taha Kelly",
            "Jensen Huber",
            "Jaya Hewitt",
            "Hari Nielsen",
            "Celeste Higgins",
            "Soraya Farrell",
            "Jacob Copeland",
            "Robbie Soto",
            "Krishan Kelley",
            "Erica Ferrell",
            "Moshe Valenzuela",
            "Ahmed Mathews",
            "Emilie Moore",
            "Anisa Gamble",
            "Esmee Haines",
            "Francesca Fischer",
            "Md Mcdaniel",
            "Saarah Zamora",
            "Tomos Ponce",
            "Sonia Barrera",
            "Pedro Hogan",
            "Connie Weeks"
        ]
        const how_many = 50
        for(let i=0; i<how_many; i++)
        {
            reef_users.push(
                {
                    Id: 1000+i,
                    [nameAttrib]: names[i],
                    [emailAttrib]: 'u@fake.com',
                    [refAttrib]: `./User/${1000+i}`
                }
            )
        }
    }

    async function on_new_user_requested()
    {
        if(!name_input?.validate())
            return;

        if(!email_input?.validate())
            return;

        let result = await reef.post('/sys/invite_user',
                        {
                            email: new_user.email,
                            admin: new_user.maintainer,
                            set:
                            {
                                [nameAttrib]: new_user.name,
                                [emailAttrib]: new_user.email
                            }
                        })
        if(result)
        {
            let created_user = result.User;
            let new_reef_user = {
                [nameAttrib]: created_user[nameAttrib],
                [emailAttrib]: created_user[emailAttrib],
                [refAttrib]: created_user[refAttrib]
            }

            let details = await reef.get(`/sys/user_details?email=${new_reef_user[emailAttrib]}`)
            set_user_info(new_reef_user, details);

            reef_users = [...reef_users, new_reef_user]
            list?.reload(reef_users);
        }



        new_user.name = '';
        new_user.email = '';
        new_user.maintainer = false;
        create_new_user_enabled = false;
    }

    function on_new_user_canceled()
    {
        new_user.name = '';
        new_user.email = '';
        new_user.maintainer = false;
        create_new_user_enabled = false;
    }

</script>

<Page   self={data_item} 
        cl="!bg-white dark:!bg-stone-900 w-full flex flex-col overflow-x-hidden py-1 px-1 border-0" 
        toolbarOperations={page_operations}
        clearsContext='props sel'>
    <!--a href="/" class="underline text-sm font-semibold ml-3"> &lt; Back to root</a-->

    {#if reef_users && reef_users.length > 0}
    <List       objects={reef_users} 
                title='Members' 
                toolbarOperations={user_operations} 
                contextMenu={user_context_menu}
                bind:this={list}>
            <ListTitle a={nameAttrib} onChange={on_name_changed}/>
            <ListSummary a={emailAttrib} readonly/>

            <ListStaticProperty name="Membership" a="membership_tag"/>
            
            <ListComboProperty name='Privileges' a='auth_group' onSelect={on_change_privileges}>
                <ComboItem name='None'       key={0}  />
                <ComboItem name='Can see'    key={1}  />
                <ComboItem name='Can invite' key={3}  />
                <ComboItem name='Can fully manage' key={7}  />
            </ListComboProperty>

            {#if showFiles}
            <ListComboProperty name='Files' a='files_group' onSelect={on_change_files_access}>
                <ComboItem name='None'      key={0}  />
                <ComboItem name='Read'      key={1}  />
                <ComboItem name='Write'     key={2}  />
                <ComboItem name='Read&Write' key={3}  />
            </ListComboProperty>
            {/if}

            
    </List>
    {/if}

</Page>

<Modal  bind:open={create_new_user_enabled}
        title='Invite someone'
        okCaption='Invite'
        onOkCallback={on_new_user_requested}
        onCancelCallback={on_new_user_canceled}
        icon={FaUserPlus}>
            <Input  label='Name' 
                    placeholder='' 
                    self={new_user} 
                    a="name"
                    validateCb={is_valid_name}
                    bind:this={name_input}/>
            
            <Input  label='E-mail' 
                    placeholder='' 
                    self={new_user} 
                    a="email" 
                    validateCb={is_valid_email_address}
                    bind:this={email_input}/>

            <Checkbox class="mt-2 text-xs font-normal" self={new_user} a="maintainer">
                <div class="flex flex-row items-center">
                    <span class="">Maintainer</span>
                    <Icon id="b1" size={4} component={FaInfoCircle} class="text-stone-400 ml-5 pt-0 mt-1"/>
                    <Popover class="w-64 text-sm font-light" title="Maintainer" triggeredBy="#b1" color="dropdown">
                        Means that the invited user will be able to add and remove others and manage permissions in this organization.
                    </Popover>
                </div>
            </Checkbox>
</Modal>

