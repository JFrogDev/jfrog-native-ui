#!/bin/bash -e
# -e will cause any subsequent commands which fail will cause the shell script to exit immediately

##
# Created by Tomer Elkayam @ 15/10/2018
##

#########################################################################################
# You should run this file in the following manner for a regular (major/minor) version: #
#  source ./publish-npm.sh 2.3.2                                                        #
# Or for a beta version:                                                                #
#  source ./publish-npm.sh 2.1.5-beta                                                   #
#########################################################################################

# If jq is not installed run: brew install jq

# First we update the version of jfrog-native-ui in the package.json file
echo Updating jfrog-native-ui version: $1 in "package.json"
jq '.version = $newVal' --arg newVal $1 ./package.json > tmp.$$.json && mv tmp.$$.json ./package.json && rm -f tmp.$$.json

# Then we save the version number in BUILD_VERSION for when the version is build
export BUILD_VERSION=$1
echo Set BUILD_VERSION: $BUILD_VERSION

# Build jfrog-native-ui
echo Building jfrog-native-ui:
gulp build

# Auto committing & pushing build files
echo Committing and pushing build files:
git add . -A
commit_message="Version $1 - Pre-tag"
echo Creating commit: "$commit_message"
git commit -m "$commit_message"
git push

# Auto tag & push
echo Creating and pushing a new tag:
git tag $1
git push --tags

# Stash the .npmrc file
echo Stashing your .npmrc file
mv ~/.npmrc ~/.NPMTMP

# Log into npm using your credentials
echo Log in to npm using your credentials:
npm login

# If the second arg $2 is set to "beta" or $1 ends with "-beta" - assume a beta version is being published
if [ -n $2 -a "$2" =~ ^.*beta$ ] || [[ $1 =~ ^.*-beta$ ]]; then
    echo Publishing a beta version $1:
    npm publish --tag beta
else
    echo Publishing version $1:
    npm publish --tag
fi

# TODO: unstash .npmrc on failure
# Un-stash the .npmrc file
echo Un-stashing your .npmrc file
mv ~/.NPMTMP ~/.npmrc