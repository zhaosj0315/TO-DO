#!/bin/bash

echo "📱 iOS 真机打包配置向导"
echo "================================"
echo ""
echo "⚠️  需要手动配置签名，请按以下步骤操作："
echo ""
echo "1️⃣  打开 Xcode 项目："
echo "   open /Users/zhaosj/Desktop/TO-DO/ios/App/App.xcodeproj"
echo ""
echo "2️⃣  在 Xcode 中："
echo "   - 选择左侧项目导航器中的 'App' 项目"
echo "   - 选择 'App' Target"
echo "   - 点击 'Signing & Capabilities' 标签"
echo "   - 勾选 'Automatically manage signing'"
echo "   - 在 'Team' 下拉框中选择你的开发者账号"
echo "   - 确保 Bundle Identifier 为: com.zhaosj0315.todo315.app"
echo ""
echo "3️⃣  配置完成后，运行以下命令打包："
echo ""
echo "   cd /Users/zhaosj/Desktop/TO-DO/ios/App"
echo "   xcodebuild -project App.xcodeproj -scheme App -configuration Release -sdk iphoneos -archivePath ./build/TODO-App.xcarchive archive -allowProvisioningUpdates"
echo "   xcodebuild -exportArchive -archivePath ./build/TODO-App.xcarchive -exportPath ./build -exportOptionsPlist exportOptions.plist -allowProvisioningUpdates"
echo ""
echo "4️⃣  打包完成后，IPA 文件位于："
echo "   /Users/zhaosj/Desktop/TO-DO/ios/App/build/App.ipa"
echo ""
echo "================================"
echo ""
read -p "是否现在打开 Xcode 进行配置？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    open /Users/zhaosj/Desktop/TO-DO/ios/App/App.xcodeproj
    echo "✅ Xcode 已打开，请按照上述步骤配置签名"
fi
