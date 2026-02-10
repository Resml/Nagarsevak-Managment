#!/usr/bin/env perl
use strict;
use warnings;

# Read the whole file
local $/;
open my $fh, '<:utf8', 'bot/menuNavigator.js' or die "Cannot read: $!";
my $content = <$fh>;
close $fh;

# Fix pattern: '
# followed by newline and emoji/text, ending with '
# Replace with '\n and the content on same line with '

# Pattern: ends with ' then newline then content then '
$content =~ s/= lang === '(en|mr|hi)' \? '\n(.*?)' :/= lang === '$1' ? '\\n$2' :/gs;

# Fix any remaining template strings with literal newlines
$content =~ s/(['"]) :\n\s+lang/'\n' :\n                        lang/gs;
$content =~ s/'\n(📄|🔍|👤|❌|✅|💡)/'\\n$1/g;

# Write back
open $fh, '>:utf8', 'bot/menuNavigator.js' or die "Cannot write: $!";
print $fh $content;
close $fh;

print "✅ Fixed all template strings\n";
