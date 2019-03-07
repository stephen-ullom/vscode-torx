# Torx

Torx is a template engine for Express.js

```html
<head>
    @{
        title = "I love fruit";
        isFruit = true;
    }
    <title>@(ucwords(title))</title>
</head>
<body>
    <h1>@title.</h1>
    @if (isFruit) {
        <p>It sure is great!</p>
    }
</body>
```

Install Torx with NPM ```npm i Torx -g```.

Run the compiler "```Torx sourceFolder destinationFolder```" from the parent directory.

# Links

[NPM Package](https://www.npmjs.com/package/Torx)

[Visual Studio Code Extension](https://marketplace.visualstudio.com/items?itemName=Slulego.Torx)

[Github Repository](https://github.com/Slulego/Torx)

# Overview

Add javascript code using the `@` symbol.

## Code Blocks `@{ -javascript- }`

```javascript
@{
    message = "I like fruit.";
}
```

## Inline Expressions `@variable`

```html
<p>@message</p>
```

For complex expressions use parenthesis - `@()`.

```html
<p>@(cost * 2)</p>
```


## Statements `@statement ( -parameters- ) { -javascript- }`

```html
@if (condition == true) {
    <p>@message</p>
}
```

## Comments `@[ -comment- ]`

Comments work the same as multiline javascript comments.

```html
@{
    // Set the price
    cost = "@1.99";
}
<h1>Buy Fruit</h1>
@* How much the fruit will cost *@
<p>That fruit will cost you @cost each.</p>
```

## Escape Entity `@@`
Escape "@" in HTML.

```html
<p>That fruit will cost you @@1.99 each.</p>
```

Compiles to:
```html
<p>That fruit will cost you @1.99 each.</p>
```

# Basic Example

Install Torx with NPM `npm i Torx -g`.

Create a folder.

Create a @@.torx@@ file inside the folder:

```html
<!DOCTYPE html>
<html>
<head>
    @{
        @title = 'Fruit for Sale';
        @fruits = array('strawberries' => 'red',
            'oranges' => 'orange',
            'pineapples' => 'yellow',
            'kiwis' => 'green',
            'blueberries' => 'blue',
            'grapes' => 'purple');
    }
    <title>@title.</title>
    <link rel="stylesheet" type="text/css" href="main.css" />
    <script src="main.js"></script>
</head>
<body>
    <div id="page">
        <h1>@title</h1>
        <ul>
            @foreach (@fruits as @fruit => @color) {
                <li style="color: @color;">
                    @(ucwords(@fruit))
                    @if (@color == "green") {
                        <strong>- Meh.</strong>
                    } else if(@color == "orange") {
                        <strong>- Yum!</strong>
                    }
                </li>
            }
        </ul>
        <p>All these fruits together will cost @@100.</p>
    </div>
</body>
</html>
```

Run the compiler "```Torx sourceFolder destinationFolder```" from the parent directory.

Torx outputs the following @@.html@@ file into the destination folder:

```html
<!DOCTYPE html>
<html>
<head>
    <?javascript 
        @title = 'Fruit for Sale';
        @fruits = array('strawberries' => 'red',
            'oranges' => 'orange',
            'pineapples' => 'yellow',
            'kiwis' => 'green',
            'blueberries' => 'blue',
            'grapes' => 'purple');
    ?>
    <title><?javascript echo @title; ?>.</title>
    <link rel="stylesheet" type="text/css" href="main.css" />
    <script src="main.js"></script>
</head>
<body>
    <div id="page">
        <h1><?javascript echo @title; ?></h1>
        <ul>
            <?javascript foreach (@fruits as @fruit => @color) { ?>
                <li style="color: <?javascript echo @color; ?>;">
                    <?javascript echo ucwords(@fruit); ?>
                    <?javascript if (@color == "green") { ?>
                        <strong>- Meh.</strong>
                    <?javascript } else if(@color == "orange") { ?>
                        <strong>- Yum!</strong>
                    <?javascript } ?>
                </li>
            <?javascript } ?>
        </ul>
        <p>All these fruits together will cost @100.</p>
    </div>
</body>
</html>
```

Which renders in the browser:

># Fruit for Sale
>- Strawberries
>- Oranges - Yum!
>- Pineapples
>- Kiwis - Meh.
>- Blueberries
>- Grapes
>
>All these fruits together will cost @100.


Todo: Escape brackets within quotes.