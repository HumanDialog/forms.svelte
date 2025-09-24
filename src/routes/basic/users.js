
const octopusTestUsers = [
    {
        username: "alice@example.com",
        role: 'GroupOwner',
        groupId: 15
    },
    {
        username: "bob@example.com",
        role: 'GroupMember',
        groupId: 15
    }
]

const hdTestUsers = [
    {
        username: "aga@humandialog.com.pl",
        role: 'GroupOwner',
        groupId: 1
    },
    {
        username: "akr@humandialog.com.pl",
        role: 'supervisor',
        groupId: 1
    }
]

function getAppUsers(setName)
{
    switch(setName)
    {
    case 'octopus':
        return octopusTestUsers;

    case 'hd':
        return hdTestUsers;
    }
}

export const appUsers = getAppUsers(__USERS_SET__)
