import type { rList_property } from "../list/List";

export const KanbanCardTop = 1;
export const KanbanCardMiddle = 2;
export const KanbanCardBottom = 3;

export class rKanban_column
{
    public  id:         number;
    public  title:      string = '';
    public  width:      string = '';
    public  state:      any = '';
    public  finishing:  boolean = false
    public  operations: object[]|undefined = undefined;
    public  onTitleChanged: Function|undefined = undefined;

}

export class rKanban_definition
{
    public  columns:        rKanban_column[] = [];
    public  titleAttrib:    string = '';
    public  titleOnChange:  Function | undefined = undefined;
    public  titleReadOnly:  boolean = false;
    public  titleHref:      string | undefined = undefined
    public  titleHrefFunc:  Function | undefined = undefined;
    public  titleHasAttachment: Function | undefined = undefined;
    public  summaryAttrib:  string = '';
    public  summaryOnChange: Function | undefined = undefined;
    public  summaryReadOnly: boolean = false;

    public properties           :rList_property[] = [];

    public  self:       object|undefined = undefined;
    public  a:          string = '';
    public  objects:    object[]|undefined = undefined;
    public  context:    string = ''
    public  key:        string = ''
    public  typename:   string = ''

    public  stateAttrib: string = '';
    public  orderAttrib: string = ''

    public  onUp: Function | undefined = undefined;
    public  onDown: Function | undefined = undefined;
    public  onAdd: Function | undefined = undefined;
    public  onRemove: Function | undefined = undefined;
    public  onReplace: Function | undefined = undefined;
    public  onOpen: Function | undefined = undefined;
   
    public  getCardOperations: Function | undefined = undefined;
    
    private  items: object[] | null = null;
    public   getItems() : object[]
    {
        if(this.items == null)
        {
            let item = this.self;
            this.items = null;

            if(this.objects)
                this.items = this.objects;
            else if(item && this.a )
                this.items = item[this.a];

            if(this.items == null)
                this.items = [];
        }
        return this.items;
    }

    public visibleColumnsNo() :number
    {
        // has <Other> column
        if(this.columns.find( (c) => c.state < 0))
        {
            const allItems = this.getItems();

            const isExplicitState = (e) => {
                const elementState = e[this.stateAttrib];
                const colsNo = this.columns.length;
                for(let i=0; i<colsNo; i++)
                {
                    const def: rKanban_column = this.columns[i];
                    if((def.state >= 0) && (def.state == elementState))
                        return true;
                }
                return false;
            }

            const unknownStateItems = allItems.filter( e => !isExplicitState(e))
            if(unknownStateItems && (unknownStateItems.length > 0))
                return this.columns.length;
            else
                return this.columns.length - 1;
        }
        else
            return this.columns.length;
    }

    public clear() 
    {
        this.columns = [];
        this.titleAttrib = '';
        this.titleOnChange = undefined;
        this.titleReadOnly = false;
        this.summaryAttrib = '';
        this.summaryOnChange = undefined;
        this.summaryReadOnly = false;
        this.properties = [];
        this.self = undefined;
        this.a = '';
        this.objects = undefined;
        this.context = ''
        this.key = ''
        this.typename = ''

        this.stateAttrib = '';
        this.orderAttrib = ''

        this.onUp = undefined;
        this.onDown = undefined;
        this.onAdd = undefined;
        this.onRemove = undefined;
        this.onReplace = undefined;
        this.onOpen = undefined;

        this.getCardOperations = undefined;
        this.items = null;
    }

}

export const KanbanColumnTop = -1
export const KanbanColumnBottom = -2