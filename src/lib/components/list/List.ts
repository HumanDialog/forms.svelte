import {rCombo_definition} from '../combo/combo'

export enum rList_property_type
{
    Hidden,
    Text,
    Date,
    Combo
}

export class rList_property
{
    constructor(type :rList_property_type)
    {
        this.type = type;
    }

    public type         :rList_property_type = rList_property_type.Hidden;
    public name         :string = '';
    public a            :string = '';
    public on_select    :Function | undefined = undefined;
}

export class rList_property_combo extends rList_property
{
    constructor()
    {
        super(rList_property_type.Combo);
        this.combo_definition = new rCombo_definition;
    }

    public association      :boolean = false;
    public combo_definition :rCombo_definition;
}


export class rList_definition
{
    public title                :string = '';
    public title_editable       :boolean = false;

    public summary              :string = '';
    public summary_editable     :boolean = false;

    public can_insert           :boolean = false;
    public oninsert             :Function | undefined = undefined;

    public properties           :rList_property[] = [];
}