<script>
    import {    FaUserPlus,
                FaUserMinus,
                FaPen,
                FaInfoCircle,
                FaChevronDown} from 'svelte-icons/fa'
    
    import Page from './page.svelte'
    import List from './components/list/list.svelte'
    import ListTitle from './components/list/list.title.svelte'
    import ListSummary from './components/list/list.summary.svelte'
    import ListComboProperty from './components/list/list.combo.svelte'
    import ComboItem from './components/combo/combo.item.svelte'
    import ListStaticProperty from './components/list/list.static.svelte'
    import Input from './components/inputbox.ltop.svelte';
    import Icon from "./components/icon.svelte";
    import Combo from './components/combo/combo.svelte'
	import Modal from './modal.svelte'
	import Checkbox from '$lib/components/checkbox.svelte';
    import {Popover, Alert} from 'flowbite-svelte'
	import { reef } from '@humandialog/auth.svelte';
	import { ComboSource } from '$lib';
    import {removeAt} from './utils'
    import {showMenu} from '$lib/components/menu'
	

    // ==============================================================================

    export let users = undefined;
    export let nameAttrib = "Name";
    export let emailAttrib = "login";
    export let refAttrib = "$ref";
    export let showFiles = false;
    //export let show_admin = true;
    export let showAccessRoles = false;

    // ===============================================================================
  
    $: init();
   
    // ===============================================================================

	let list;

    let create_new_user_enabled = false;

    let reef_users = [];
    let new_reef_user_id = 1;
    let access_roles = [];

    let fake_users;

    const authAccessKinds = [
        { name: 'No auth access', key: 0 },
        { name: 'Read auth access', key: 1 },
        { name: 'Can invite others', key: 3 },
        { name: 'Full auth access', key: 7 },
    ]

    const filesAccessKinds = [
        { name: 'Can read files', key: 0 },
        { name: 'Can write files', key: 1 },
        { name: 'Full files access', key: 3 },
    ]

    async function init()
    {
        if(showAccessRoles)
        {
            let roles = await reef.get('/sys/list_access_roles')
            access_roles = [];
            if(roles)
                roles.forEach( gname => access_roles.push({name: gname}));
        }


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
                        acc_role: "",
                        //other: "",
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
                //reef_users = [...reef_users]
                
                list?.reload(reef_users);
            }
        } )

    }

    function set_user_info(user, info)
    {
        user.auth_group = info.auth_group ?? 0;
        user.files_group = info.files_group ?? 0;
        user.avatar_url = info.avatar_url ?? "";
        user.access_details = info.access_details
        user.acc_role = info.access_details?.role ?? '';
        user.removed = info.removed ?? false;
        user.invitation_not_accepted = info.invitation_not_accepted ?? false;
        //console.log(info)

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
        auth_group: 0,
        files_group: 0,
        acc_role: ''
    }

    let name_input;
    let email_input;

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
            const res = await reef.fetch(`/json/anyv/sys/set_user_details?email=${email}&auth_group=${flags}`)
            if(res.ok)
            {
                const response_string = await res.text();
                const info = JSON.parse(response_string);
                
                user.auth_group = flags;

                set_user_info(user, info)
                list?.rereder();
                return true;
            }
            else
            {
                const err_msg = await res.text();
                alerts.push(err_msg)
                alerts = [...alerts];
                return false;
            }
        }
        return false;
    }

    async function on_change_files_access(user, flags, name)
    {
        if(user.files_group != flags)
        {
            let email = user[emailAttrib];
            const res = await reef.fetch(`/json/anyv/sys/set_user_details?email=${email}&files_group=${flags}`)
            if(res.ok)
            {
                const response_string = await res.text();
                const info = JSON.parse(response_string);
                
                user.files_group = flags;

                set_user_info(user, info)
                list?.rereder();
                return true;
            }
            else
            {
                const err_msg = await res.text();
                alerts.push(err_msg)
                alerts = [...alerts];
                return false;
            }
        }
        return false;
    }

    async function on_change_access_role(user, role, name)
    {
        if(user.access_details && user.access_details.role != role)
        {
            const email = user[emailAttrib];
            const res = await reef.fetch(`/json/anyv/sys/set_user_role?email=${email}&role=${role}`)
            if(res.ok)
            {
                const response_string = await res.text();
                const info = JSON.parse(response_string);
                
                user.access_details.role = role;   
                user.acc_role = role

                set_user_info(user, info)
                list?.rereder();
                return true;
            }
            else
            {
                const err_msg = await res.text();
                alerts = [err_msg, ...alerts];
                return false;
            }
        }
        return false;
    }
    
    function create_new_user()
    {
        if(showAccessRoles)
            new_user.acc_role = access_roles[0].name

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
                caption: 'Users management',
                action: (focused) => { list.edit(user, 'Privileges') }
            }];

        if(showAccessRoles)
        {
            operations.push({
                separator: true
            });

            operations.push({
                caption: 'Access role',
                action: (focused) => { list.edit(user, 'Access') }
            });
        }

        if(showFiles)
        {
            operations.push({
                caption: 'External files',
                action: (focused) => { list.edit(user, 'Files') }
            });
        }
        
        return operations;
    }

    let user_operations = (user) => { 
        
        let operations = [];

        if(user.removed)
            return [];
        
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
                            action: (focused) => askToRemove(user)
                        });

        return operations;
    }

    let user_context_menu = (user) => {
        if(user.removed)
            return [];

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

        try {
                const res = await reef.fetch('/json/anyv/sys/invite_user', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: new_user.email,
                                auth_group: new_user.auth_group,
                                files_group: new_user.files_group,
                                role: new_user.acc_role,
                                set:
                                {
                                    [nameAttrib]: new_user.name,
                                    [emailAttrib]: new_user.email
                                }
                            })
                        })

                if(res.ok)
                {
                    const result = await res.json();
                    let created_user = result.User;
                    let new_reef_user = {
                        [nameAttrib]: created_user[nameAttrib],
                        [emailAttrib]: created_user[emailAttrib],
                        [refAttrib]: created_user[refAttrib]
                    }

                    let details = await reef.get(`/sys/user_details?email=${new_reef_user[emailAttrib]}`)
                    set_user_info(new_reef_user, details);

                    let sameUserIdx = reef_users.findIndex(ru => ru[refAttrib] == new_reef_user[refAttrib])
                    if(sameUserIdx >= 0)
                    {
                        reef_users[sameUserIdx] = new_reef_user;
                        reef_users = [... reef_users];
                    }
                    else
                    {
                        reef_users = [...reef_users, new_reef_user]
                    }

                    
                    list?.reload(reef_users);
                }
                else
                {
                    const err_msg = await res.text();
                    alerts = [err_msg, ...alerts];
                }
        }
        catch (err)
        {
            alerts = [err, ...alerts];
        }

        new_user.name = '';
        new_user.email = '';
        new_user.auth_group = 0;
        new_user.files_group = 0;
        new_user.acc_role = ''

        create_new_user_enabled = false;
    }

    function on_new_user_canceled()
    {
        new_user.name = '';
        new_user.email = '';
        new_user.auth_group = 0;
        new_user.files_group = 0;
        new_user.acc_role = ''

        create_new_user_enabled = false;
    }

    let alerts = []

    let removeModal;
    let userToRemove;
    function askToRemove(user)
    {
        userToRemove = user;
        removeModal.show()
    }

    async function removeUser()
    {
        if(!userToRemove)
            return;

        let email = userToRemove[emailAttrib];
        try{

            const res = await reef.fetch('/json/anyv/sys/kick_out_user?email=' + email)
            removeModal.hide();

            if(res.ok)
            {
                const removed_user_details = await res.json();
                //let removed_user = reef_users.find( u => u[emailAttrib] == user[emailAttrib])
                set_user_info(userToRemove, removed_user_details);
                list?.rereder();
            }
            else
            {
                const err = await res.text()
                alerts = [err, ...alerts];
            }
        }
        catch(err)
        {
            alerts = [err, ...alerts];
        }
    }

    
</script>

<Page   self={data_item} 
        cl="!bg-white dark:!bg-stone-900 w-full flex flex-col overflow-x-hidden py-1 px-1 border-0" 
        toolbarOperations={page_operations}
        clearsContext='props sel'>
    <!--a href="/" class="underline text-sm font-semibold ml-3"> &lt; Back to root</a-->

    <!-- alerts -->
    <section class="absolute left-2 sm:left-auto sm:right-2 bottom-2 flex flex-col gap-2">
        {#each alerts as alert, idx}
            <Alert class="bg-red-900/40  shadow-lg shadow-stone-400 dark:shadow-black flex flex-row">
                <p>
                    {alert}
                </p>
                <button class="font-bold  ml-auto"
                        on:click={() => {alerts = removeAt(alerts, idx)}}>
                    x
                </button>
            </Alert>    
        {/each}
    </section>
    
    

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
                {#each authAccessKinds as kind}
                    <ComboItem name={kind.name} key={kind.key}  />    
                {/each}
            </ListComboProperty>

            {#if showAccessRoles}
                <ListComboProperty name='Access' a='acc_role' onSelect={on_change_access_role}>
                    <ComboSource objects={access_roles} name='name' key='name'/>
                </ListComboProperty>
            {/if}

            {#if showFiles}
            <ListComboProperty name='Files' a='files_group' onSelect={on_change_files_access}>
                {#each filesAccessKinds as kind}
                    <ComboItem name={kind.name} key={kind.key}  />    
                {/each}
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
            
            <Input  label='E-mail' 
                    placeholder='' 
                    self={new_user} 
                    a="email" 
                    validation={is_valid_email_address}
                    bind:this={email_input}/>

            <Input  label='Name' 
                    placeholder='Optional' 
                    self={new_user} 
                    a="name"
                    bind:this={name_input}/>

            <!--Checkbox class="mt-2 text-xs font-normal" self={new_user} a="maintainer">
                <div class="flex flex-row items-center">
                    <span class="">Maintainer</span>
                    <Icon id="b1" size={4} component={FaInfoCircle} class="text-stone-400 ml-5 pt-0 mt-1"/>
                    <Popover class="w-64 text-sm font-light text-stone-500 bg-white dark:bg-stone-800 dark:border-stone-600 dark:text-stone-400" triggeredBy="#b1" color="dropdown">
                        Means that the invited user will be able to add/remove others and manage permissions in this organization.
                    </Popover>
                </div>
            </Checkbox-->

            <!-- There is problem with dropdown/combo on dialogs (nested fixed stacks) -->
            <!--Combo class="mt-2" label='Privileges' a='auth_group' self={new_user} >
                <ComboItem name='No auth access'    key={0}  />
                <ComboItem name='Read auth access'  key={1}  />
                <ComboItem name='Can invite others' key={3}  />
                <ComboItem name='Full auth access'  key={7}  />
            </Combo-->

            <section class="mt-2 grid grid-cols-2 gap-2">
                <div class="flex flex-col">
                    <label for="new_user_auth_group"
                            class="text-xs">
                        Auth access
                    </label>
                    <button id="new_user_auth_group"
                            class=" w-full mt-0.5
                                    bg-stone-50 border border-stone-300 text-stone-900 text-base sm:text-sm rounded-lg 
                                    focus:ring-primary-600 focus:border-primary-600 pb-0.5 pt-0.5 px-2.5 dark:bg-stone-700 
                                    dark:border-stone-600 dark:placeholder-stone-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            on:click={(e) => {
                        let owner = e.target;
                        while(owner && owner.tagName != 'BUTTON')
                            owner = owner.parentElement

                        if(!owner)
                            return;

                        let options = [];
                        authAccessKinds.forEach(k => options.push({
                            caption: k.name,
                            action: (f) => { new_user.auth_group=k.key}
                        }));

                        let rect = owner.getBoundingClientRect();
                        let pt = new DOMPoint(rect.left, rect.bottom)
                        showMenu(pt, options);   
                    }}>
                        {authAccessKinds.find(k => k.key == new_user.auth_group)?.name}
                        <span class="w-3 h-3 inline-block text-stone-700 dark:text-stone-300 ml-2 mt-2 sm:mt-1">
                            <FaChevronDown/>
                        </span>
                    </button>
                </div>

                {#if showFiles}
                    <div class="flex flex-col">
                        <label for="new_user_auth_group"
                                class="text-xs">
                            Files access
                        </label>
                        <button 
                                class=" mt-0.5 w-full
                                        bg-stone-50 border border-stone-300 text-stone-900 text-base sm:text-sm rounded-lg 
                                        focus:ring-primary-600 focus:border-primary-600 pb-0.5 pt-0.5 px-2.5 dark:bg-stone-700 
                                        dark:border-stone-600 dark:placeholder-stone-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                on:click={(e) => {
                            let owner = e.target;
                            while(owner && owner.tagName != 'BUTTON')
                                owner = owner.parentElement

                            if(!owner)
                                return;

                            let options = [];
                            filesAccessKinds.forEach(k => options.push({
                                caption: k.name,
                                action: (f) => { new_user.files_group=k.key}
                            }));

                            let rect = owner.getBoundingClientRect();
                            let pt = new DOMPoint(rect.left, rect.bottom)
                            showMenu(pt, options);   
                        }}>
                            {filesAccessKinds.find(k => k.key == new_user.files_group)?.name}
                            <span class="w-3 h-3 inline-block text-stone-700 dark:text-stone-300 ml-2 mt-2 sm:mt-1">
                                <FaChevronDown/>
                            </span>
                        </button>
                    </div>
                {/if}

                {#if showAccessRoles}
                    <div class="flex flex-col">
                        <label for="new_user_auth_group"
                                class="text-xs">
                            App role
                        </label>
                        <button 
                                class=" mt-0.5 w-full
                                        bg-stone-50 border border-stone-300 text-stone-900 text-base sm:text-sm rounded-lg 
                                        focus:ring-primary-600 focus:border-primary-600 pb-0.5 pt-0.5 px-2.5 dark:bg-stone-700 
                                        dark:border-stone-600 dark:placeholder-stone-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                on:click={(e) => {
                            let owner = e.target;
                            while(owner && owner.tagName != 'BUTTON')
                                owner = owner.parentElement

                            if(!owner)
                                return;

                            let options = [];
                            access_roles.forEach(k => options.push({
                                caption: k.name,
                                action: (f) => { new_user.acc_role=k.name}
                            }));

                            let rect = owner.getBoundingClientRect();
                            let pt = new DOMPoint(rect.left, rect.bottom)
                            showMenu(pt, options);   
                        }}>
                            {new_user.acc_role ? new_user.acc_role : '<none>'}
                            <span class="w-3 h-3 inline-block text-stone-700 dark:text-stone-300 ml-2 mt-2 sm:mt-1">
                                <FaChevronDown/>
                            </span>
                        </button>
                    </div>
                {/if}
            </section>
</Modal>

<Modal  title="User removal"
        content="Are you sure you want to remove {userToRemove ? userToRemove[nameAttrib] : 'user'} from the group?"
        icon={FaUserMinus}
        okCaption='Remove'
        onOkCallback={removeUser}
        bind:this={removeModal}
        />