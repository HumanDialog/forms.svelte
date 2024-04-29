<script lang="ts">
    import { tick }  from 'svelte';
    import {    Page, 
                Row, 
                Tile, 
                Box,
                Input,
                Combo,
                ComboItem,
                ComboSource} from '../../lib'


    let self = {
        Priority: 4,
        Name: "ToDo",
        Description: '',
        Responsible: 
        {
            $ref: './User/2',
            Name: 'Alice'
        }
    }

    async function on_users_combo_source() :Promise<object>
    {
        await tick();
        return {
            User:[
                {
                    $ref: './User/1',
                    Name: 'Bob'
                },
                {
                    $ref: './User/2',
                    Name: 'Alice'
                }
            ]
        }
    }

    async function on_user_select(context :object, key :string, name :string)
    {
        self.Responsible.$ref = key;
        self.Responsible.Name = name;
    }
</script>

<a href="/" class="underline text-sm font-semibold ml-3"> &lt; Back to root</a>

<Page self={self} typename='Task' cl="w-full overflow-y-hidden  overflow-x-scroll py-0 px-1 border-0" >
    <Row cl="grid-cols-2 h-full max-h-full overflow-y-hidden" w="w-[calc(200vw)] sm:w-[calc(200vw-80px)] lg:w-[calc(100vw-40px)]" >
        <Tile cl="col-span-1 h-full max-h-full overflow-y-hidden">
            <Box  c=5>  
                <Input c=5 a="Name"/>
                <Combo c=2 a="Priority" icon={true}>
                    <ComboItem name='Urgent'   key={4}     color='rgb(200, 50, 50)' />
                    <ComboItem name='High'     key={3}     color='rgb(150, 100, 50)' />
                    <ComboItem name='Medium'   key={2}     color='rgb(100, 100, 100)' />
                    <ComboItem name='Low'      key={1}     color='rgb(50, 100, 100)' />
                    <ComboItem name='Never'    key={0}     color='rgb(50, 50, 150)' />
                </Combo>

                <Combo c=3 a="Responsible" icon={true} onSelect={async (task, sel_key, sel_name) => {await on_user_select(task, sel_key, sel_name)}}>
                    <ComboSource onCollect={on_users_combo_source} key="$ref" name='Name'/>
                    
                </Combo>
            </Box>
        </Tile>
        <Tile cl="col-span-1 h-full max-h-full overflow-y-hidden">
            <Box c=1 fit={true}>
                <Input c=1 itype='html' a='Description' />
            </Box>
        </Tile>
    </Row>
</Page>