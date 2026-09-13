package com.qiyu.application.system;

import com.qiyu.application.system.dto.SystemModels.Organization;
import com.qiyu.application.system.dto.SystemModels.OrganizationCommand;
import java.util.*;

/** Validates structure independently of persistence; callers hold the hierarchy lock. */
public final class OrganizationHierarchy {
    private OrganizationHierarchy() {}
    public static Set<String> descendants(List<Organization> rows, String id) {
        Set<String> result=new LinkedHashSet<>();result.add(id);
        boolean changed;
        do {changed=false;for(var row:rows)if(result.contains(row.parentId()))changed|=result.add(row.id());}while(changed);
        return result;
    }
    public static void validate(List<Organization> rows, String id, OrganizationCommand command) {
        if(command.type()==null||!Set.of("HEADQUARTERS","REGION","STORE","DEPARTMENT").contains(command.type()))
            throw new IllegalArgumentException("组织类型不正确");
        if(command.status()==null||!Set.of("ENABLED","DISABLED").contains(command.status()))throw new IllegalArgumentException("组织状态不正确");
        if(command.sort()==null||command.sort()<0)throw new IllegalArgumentException("排序必须为非负整数");
        var current=rows.stream().filter(r->r.id().equals(id)).findFirst();
        if(id!=null){
            var row=current.orElseThrow(()->new IllegalArgumentException("组织不存在"));
            if(command.version()==null||command.version()!=row.version())throw new IllegalArgumentException("组织已更新，请刷新详情并核对后重新提交");
            if(!row.type().equals(command.type()))throw new IllegalArgumentException("已有组织类型不能修改");
        }
        String parent=command.parentId();
        if(parent!=null&&!parent.isBlank()){
            var target=rows.stream().filter(r->r.id().equals(parent)).findFirst().orElseThrow(()->new IllegalArgumentException("上级组织不存在"));
            if(id!=null&&descendants(rows,id).contains(parent))throw new IllegalArgumentException("不能将自身或下级组织设为上级");
            if("ENABLED".equals(command.status())&&!"ENABLED".equals(target.status()))throw new IllegalArgumentException("上级组织已停用，请先启用上级组织");
        }
        if(id!=null&&"DISABLED".equals(command.status())&&rows.stream().anyMatch(r->id.equals(r.parentId())&&"ENABLED".equals(r.status())))
            throw new IllegalArgumentException("组织仍有启用中的下级，请先处理下级组织");
    }
}
