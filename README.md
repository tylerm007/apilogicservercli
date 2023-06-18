

# API Logic Server Command Line
A command-line tool to access API Logic Server REST API and Logic services.
Refer to online documentation of creating and using  API Logic Server [REST API](https://apilogicserver.github.io/Docs/) 

## Installation

```aidl
    git clone https://github.com/EspressoLogicCafe/liveapicreator-devops.git
    cd liveapicreator-devops
    
    Select one of three directories (platform: windows, linux, and macos) and copy the 'lac' and 'lacadmin' to your
    path where you intend to run your scripts.
```


## Features

* Log in once per server, stay "logged in" for the lifetime of the API key
* Can call GET, POST, PUT and DELETE
* Can read/write objects from/to file or stdin (suitable for pipe work!)

## Command Line Service
```sh
  Usage: lac [options] [command]
  
  
    Commands:
  
      login [options] <url>                   Login to an API Server
      logout [options] [url]                  Logout from the current server, or a specific server
      use <alias>                             Use the specified server by default
      status                                  Show the current server, and any defined server aliases
      get [options] <resource>                Retrieve some data for the given resource/table/view
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
$als login -u u1 -p p http://localhost:5656
Logging in...
Login successful, JWT key will expire on: 2023-11-18T15:03:37.342Z
```


## See which API server (if any) you are logged into
```sh
$lac status

You are currently logged in to server: https://localhost:8080/rest/default/demo/v1 as user: demo
Defined aliases:
┌───────┬───────────────────────────────────────────────────────────┬───────┐
│ Alias │ Server                                                    │ User  │
├───────┼───────────────────────────────────────────────────────────┼───────┤
│sample │ https://localhost:8080/rest/default/sample/v1             │sample │
├───────┼───────────────────────────────────────────────────────────┼───────┤
│ demo  │ https://localhost:8080/rest/default/demo/v1               │ demo  │
└───────┴───────────────────────────────────────────────────────────┴───────┘
```


## DESCRIBE a system resource
This can return information about all tables, or one specific table,
or all views/one specific view, or get information about the server
or the server's license. The possible values for the resource are:

* tables
* tables/&lt;table-name>
* views
* views/&lt;view-name>
* license
* serverinfo

```sh
$lac describe tables

DB    Table
----  -------------------
demo  customer
demo  employee
demo  employee_picture
demo  LineItem
demo  product
demo  PurchaseOrder
demo  purchaseorder_audit
```

```sh
$lac describe tables/product

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
    -f, --sysfilter <sysfilter>      Optional: sysfilter, e.g. "less(balance:1000) or equal(name:'SomeName')
    -s, --sysorder <sysorder>        Optional: sorting sysorder, e.g. "(balance asc,name desc_uc)"
    -g, --userfilter <named filter>  Optional: named filter, e.g. "namedFilter(columnName:'SomeName')
    -t, --userorder <named order>    Optional: named sorts, e.g. "namedSort([columnName])"
    -z, --pagesize <pagesize>        Optional: up to how many rows to return per level
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson    --truncate <length>
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server
```


## Get a single REST endpoint (compressed format)
```sh
$lac get demo:employee

demo:employee/1 employee_id:1 login:sam name:Sam Yosemite
demo:employee/2 employee_id:2 login:mlittlelamb name:Mary Little-Lamb
demo:employee/3 employee_id:3 login:sconnor name:Sarah Connor
demo:employee/4 employee_id:4 login:jkim name:John Kim
demo:employee/5 employee_id:5 login:bmcmanus name:Becky McManus
etc...
```

## GET a single REST endpoint (JSON format)
```sh
$lac get employee/4 -m json
[
  {
    "@metadata": {
      "href": "http://localhost:8080/rest/default/demo/v1/demo:employee/4",
      "checksum": "A:3ed29188014675ec",
      "links": [
        {
          "href": "http://llocalhost:8080/rest/default/demo/v1/demo:employee_picture?filter=employee_id%20%3D%204",
          "rel": "children",
          "role": "employee_pictureList",
          "type": "http://localhost:8080/rest/default/demo/demo:employee_picture"
        },
        {
          "href": "http://localhost:8080/rest/default/demo/v1/demo:PurchaseOrder?filter=salesrep_id%20%3D%204",
          "rel": "children",
          "role": "PurchaseOrderList",
          "type": "http://llocalhost:8080/rest/default/demo/demo:PurchaseOrder"
        }
      ]
    },
    "employee_id": 4,
    "login": "jkim",
    "name": "John Kim"
  }
]

$lac get demo:customer --userfilter "myFilter(custname:'Alpha and Sons')" --userorder "sortByName"
```

## POST (insert) a JSON payload

```sh
$lac post --help

  Usage: post <resource> [options]

  Options:

    -h, --help                       output usage information
    -j, --json <json>                JSON for the data being inserted
    -f, --jsonfile <jsonfile>        Name of a file containing JSON to be inserted, or stdin to read from stdin
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server

$lac post customer -j '{ "name": "new posted record","balance": 0,"credit_limit": 9000 }'

POST for customer:
I demo:customer/new%20posted%20record name:new posted record balance:0 credit_limit:9000
Request took: 61ms - # objects touched: 1
```

## PUT (update) a JSON Payload

```sh
$lac put --help

  Usage: put <resource> [options]

  Options:

    -h, --help                       output usage information
    -j, --json <json>                JSON string for the data being updated
    -f, --jsonfile <jsonfile>        Name of a file containing JSON to be updated, or stdin to read from stdin
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server

$ liveapicreator put customer -j '{ "@metadata": {"checksum": "A:693190f461f5402e"  }, "name": "new posted record", "credit_limit": 8000  }'

PUT for customer:
U demo:customer/new%20posted%20record name:new posted record balance:0 credit_limit:8000
Request took: 42ms - # objects touched: 1
```
note: you can replace the checksum value with "override" - but this overrides optimistic locking so use it wisely.

## DELETE a REST resource
Required fields are the primary key (--pk <pkey>) and checksum (--checksum <value>)

```sh
$lac delete --help

  Usage: delete <resource> [options]

  Options:

    -h, --help                       output usage information
    -k, --pk <pk>                    Primary key of the object to delete
    --checksum <checksum>            Optional: checksum for the object to delete, or "override". If not specified, the object will be retrieved then deleted.
    -f, --jsonfile <jsonfile>        Optional: name of a file containing JSON to be deleted, or stdin to read from stdin
    -m, --format <format>            Optional: format of output, either text (default), json or compactjson
    -a, --serverAlias <serverAlias>  Optional: alias of the server to use if other than the current default server

liveapicreator delete customer -k "new posted record" --checksum "A:e86aea2e0a4e74bf"
```
## Logout

```sh
$lac logout
Logout successful
```
