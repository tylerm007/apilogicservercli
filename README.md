

# API Logic Server Command Line
A command-line tool to access API Logic Server REST API and Logic services.
The API Logic Server must be running with security (JWT) for all commands to work correctly.
Refer to online documentation of creating and running the API Logic Server [REST API](https://apilogicserver.github.io/Docs/) 

## Installation

```aidl
    git clone https://github.com/tylerm007/apilogicservercli.git
    cd apilogicservercli
    
    node install -g

    node apilogicservercli.js --help (or use the shortcut als --help)
```


## Features

* Log in once per server, stay "logged in" for the lifetime of the API key
* Can call GET, POST, PUT and DELETE
* Can read/write objects from/to file or stdin (suitable for pipe work!)

## Command Line Service
```sh
  Usage: als [options] [command]
  
  
    Commands:
  
      login [options] <url>                   Login to an API Server
      logout [options] [url]                  Logout from the current server, or a specific server
      use <alias>                             Use the specified server by default
      status                                  Show the current server, and any defined server aliases
      get [options] <resource>                Retrieve some data for the given table/view or custom endpoint
      post [options] <resource>               Insert some data
      put [options] <resource>                Update some data
      delete [options] <resource>             Delete some data
      putdata [options] <resource>            Update a single row with an upload to a file to a named attribute (-k <key> -c <attr> -f foo.jpg)
      describe [options] <resource>           Describe the specified resource, can be: tables[/tablename], views[/viewname], resources, functions, license, serverinfo
      schema [options] <list|swagger|export>  Administer API project options for an account.
  
    Options:
  
      -h, --help     output usage information
      -V, --version  output the version number


```

## Logon to an API Server
```sh
$als login http://localhost:5656 -u u1 -p 1 -a northwind
Logging in...
Login successful, JWT key will expire on: 2023-11-18T15:03:37.342Z
```


## See which API server (if any) you are logged into
```sh
$als status

You are currently logged in to server: https://localhost:8080/rest/default/demo/v1 as user: demo
Defined aliases:
┌───────┬───────────────────────────────────────────────────────────┬───────┐
│ Alias │ Server                                                    │ User  │
├───────┼───────────────────────────────────────────────────────────┼───────┤
| nw    │ https://localhost:5656/                                   | u1    │
├───────┼───────────────────────────────────────────────────────────┼───────┤
│ demo  │ https://localhost:5656/                                   │ demo  │
└───────┴───────────────────────────────────────────────────────────┴───────┘
```


## DESCRIBE a system resource
This can return information about all tables, or one specific table,
or all views/one specific view, The possible values for the resource are:

* tables
* tables/&lt;table-name>

```sh
$als describe tables

DB    Table
----  -------------------
nw    Customer
nw    Employee
nw    Order
nw    OrderItem
nw    Product
nw    PurchaseOrder
```

```sh
$als describe table/Product

Name            Type     Size      PK
--------------  -------  --------  --
product_number  BIGINT         19  *
name            VARCHAR        50
price           DECIMAL        19
icon            BLOB        65535
full_image      BLOB     16777215
```


## GET
```sh
  Usage: get <resource> [options]

  Options:

    -h, --help                       output usage information
    -k, --pk <pk>                    Optional: primary key of the object to retrieve
    -f, --filter                     Optional: filter, e.g. "filter[name]=SomeName"
    -s, --sort                       Optional: sorting order, e.g. "sort=balance 
    -z, --pagesize <20>              Optional: up to how many rows to return per level
    -o, --offset <0>                 Optional: up to how many rows to return per level
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson    --truncate <length>
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server
```


## Get a single REST endpoint (compressed format)
```sh
$als get "apl/Employee"

demo:employee/1 employee_id:1 login:sam name:Sam Yosemite
demo:employee/2 employee_id:2 login:mlittlelamb name:Mary Little-Lamb
demo:employee/3 employee_id:3 login:sconnor name:Sarah Connor
demo:employee/4 employee_id:4 login:jkim name:John Kim
demo:employee/5 employee_id:5 login:bmcmanus name:Becky McManus
etc...
```

## GET a single REST endpoint (JSON format)
```sh
$als get "api/Employee/4" -m json
or
$als get "api/Employee" -k 4 -m json
{
 "data": {
    "employee_id": 4,
    "login": "jkim",
    "name": "John Kim"
  }
}

$als get "api/Customer" --filter "filter[Id]=Alpha and Sons" --order "CustomerName"
```

## POST (insert) a JSON payload

```sh
$als post --help

  Usage: post <resource> [options]

  Options:

    -h, --help                       output usage information
    -j, --json <json>                JSON for the data being inserted
    -f, --jsonfile <jsonfile>        Name of a file containing JSON to be inserted, or stdin to read from stdin
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server

$als post customer -j '{ "name": "new posted record","balance": 0,"credit_limit": 9000 }'

POST for customer:
I demo:customer/new%20posted%20record name:new posted record balance:0 credit_limit:9000
Request took: 61ms - # objects touched: 1
```

## PUT (update) a JSON Payload
This will send a PATCH to ALS.
```sh
$als put --help

  Usage: put <resource> [options]

  Options:

    -h, --help                       output usage information
    -j, --json <json>                JSON string for the data being updated
    -f, --jsonfile <jsonfile>        Name of a file containing JSON to be updated, or stdin to read from stdin
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server

$ als put customer -j '{"name": "new posted record", "credit_limit": 8000  }'

PUT for Customer:
U Customer/new%20posted%20record name:new posted record balance:0 credit_limit:8000
Request took: 42ms - # objects touched: 1
```

## DELETE a REST resource
Required fields are the primary key (--pk <pkey>) and checksum (--checksum <value>)

```sh
$als delete --help

  Usage: delete <resource> [options]

  Options:

    -h, --help                       output usage information
    -k, --pk <pk>                    Primary key of the object to delete
    --checksum <checksum>            Optional: checksum for the object to delete, or "override". If not specified, the object will be retrieved then deleted.
    -f, --jsonfile <jsonfile>        Optional: name of a file containing JSON to be deleted, or stdin to read from stdin
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server

als delete customer -k "new posted record" --checksum "A:e86aea2e0a4e74bf"
```
## Logout

```sh
$als logout
Logout successful
```
