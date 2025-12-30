# 10. 安全与合规

## 10.1 数据安全

### 数据加密

#### 传输加密

- **TLS 1.3**：所有API通信使用TLS 1.3加密
- **证书管理**：使用Let's Encrypt自动管理SSL证书
- **证书轮换**：定期轮换证书，确保安全性

#### 存储加密

- **数据库加密**：使用AES-256加密敏感数据
- **文件加密**：使用AES-256加密存储的文件
- **密钥管理**：使用密钥管理服务（KMS）管理加密密钥

#### 加密实现

```python
# 数据加密实现
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class DataEncryption:
    def __init__(self, password):
        """初始化加密器"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=os.urandom(16),
            iterations=100000
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, data):
        """加密数据"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data):
        """解密数据"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
```

### 访问控制

#### 身份认证

- **多因素认证（MFA）**：支持短信、邮箱、TOTP等多种认证方式
- **单点登录（SSO）**：支持OAuth 2.0、SAML等SSO协议
- **密码策略**：强制使用强密码，定期更换密码

#### 权限控制

- **基于角色的访问控制（RBAC）**：定义角色和权限，分配用户角色
- **基于属性的访问控制（ABAC）**：基于用户属性动态控制访问
- **最小权限原则**：用户只获得必要的权限

#### 访问控制实现

```python
# 访问控制实现
from functools import wraps
from flask import request, jsonify

def require_permission(permission):
    """权限装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 获取用户信息
            user = get_current_user()
            
            # 检查权限
            if not user.has_permission(permission):
                return jsonify({"error": "Permission denied"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# 使用示例
@app.route("/api/v1/students/<student_id>/data")
@require_permission("view_student_data")
def get_student_data(student_id):
    # 获取学生数据
    pass
```

### 数据脱敏

#### 脱敏策略

- **敏感字段识别**：自动识别敏感字段（姓名、身份证号、手机号等）
- **脱敏规则**：定义脱敏规则（如手机号只显示后4位）
- **脱敏实现**：在数据展示和日志记录时自动脱敏

#### 脱敏实现

```python
# 数据脱敏实现
import re

class DataMasking:
    @staticmethod
    def mask_phone(phone):
        """脱敏手机号"""
        if not phone or len(phone) < 7:
            return phone
        return phone[:3] + "****" + phone[-4:]
    
    @staticmethod
    def mask_id_card(id_card):
        """脱敏身份证号"""
        if not id_card or len(id_card) < 8:
            return id_card
        return id_card[:6] + "********" + id_card[-4:]
    
    @staticmethod
    def mask_name(name):
        """脱敏姓名"""
        if not name or len(name) < 2:
            return name
        return name[0] + "*" * (len(name) - 1)
    
    @staticmethod
    def mask_data(data, fields):
        """批量脱敏数据"""
        masked_data = data.copy()
        for field in fields:
            if field in masked_data:
                if field == "phone":
                    masked_data[field] = DataMasking.mask_phone(masked_data[field])
                elif field == "id_card":
                    masked_data[field] = DataMasking.mask_id_card(masked_data[field])
                elif field == "name":
                    masked_data[field] = DataMasking.mask_name(masked_data[field])
        return masked_data
```

## 10.2 合规要求

### 数据保护合规

#### 《个人信息保护法》合规

- **明确同意**：获得用户（或监护人）明确同意
- **告知义务**：告知数据使用目的和方式
- **用户权利**：提供数据删除、更正、查询等权利
- **未成年人保护**：对未成年人个人信息给予特殊保护

#### 《数据安全法》合规

- **数据分类分级**：建立数据分类分级管理制度
- **数据安全措施**：实施数据安全保护措施
- **数据安全评估**：定期进行数据安全评估

#### 《网络安全法》合规

- **等保认证**：实施网络安全等级保护
- **安全管理制度**：建立网络安全管理制度
- **安全检测**：定期进行网络安全检测

### 教育行业合规

#### 《教育数据安全管理办法》合规

- **学生信息保护**：保护学生个人信息和学习数据
- **数据安全管理制度**：建立教育数据安全管理制度
- **安全评估**：定期进行安全评估

#### 《未成年人网络保护条例》合规

- **特殊保护**：对未成年人给予特殊保护
- **使用时间限制**：限制未成年人使用时间
- **内容审核**：建立内容审核机制

### 合规实现

#### 合规检查清单

```python
# 合规检查清单
compliance_checklist = {
    "data_protection": {
        "user_consent": True,  # 是否获得用户同意
        "data_notification": True,  # 是否告知数据使用
        "user_rights": True,  # 是否提供用户权利
        "minors_protection": True  # 是否保护未成年人
    },
    "data_security": {
        "data_classification": True,  # 是否数据分类分级
        "encryption": True,  # 是否加密
        "access_control": True,  # 是否访问控制
        "security_assessment": True  # 是否安全评估
    },
    "network_security": {
        "security_level": True,  # 是否等保认证
        "security_management": True,  # 是否安全管理制度
        "security_detection": True  # 是否安全检测
    }
}
```

## 10.3 安全审计

### 审计日志

#### 审计内容

- **用户操作**：记录用户的所有操作
- **数据访问**：记录数据访问记录
- **系统变更**：记录系统配置变更
- **安全事件**：记录安全相关事件

#### 审计日志格式

```python
# 审计日志格式
audit_log = {
    "timestamp": "2024-01-01T10:00:00Z",
    "user_id": "user_123",
    "action": "view_student_data",
    "resource": "student_456",
    "result": "success",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "details": {
        "data_fields": ["name", "grade", "score"]
    }
}
```

### 安全监控

#### 监控内容

- **异常登录**：监控异常登录行为
- **权限滥用**：监控权限滥用行为
- **数据泄露**：监控数据泄露风险
- **攻击行为**：监控攻击行为

#### 安全监控实现

```python
# 安全监控实现
class SecurityMonitor:
    def __init__(self):
        self.alert_rules = []
    
    def check_abnormal_login(self, login_record):
        """检查异常登录"""
        # 检查登录地点
        if login_record["location"] != login_record["usual_location"]:
            self.alert("异常登录地点", login_record)
        
        # 检查登录时间
        if login_record["time"].hour < 6 or login_record["time"].hour > 23:
            self.alert("异常登录时间", login_record)
        
        # 检查登录设备
        if login_record["device"] not in login_record["usual_devices"]:
            self.alert("异常登录设备", login_record)
    
    def check_permission_abuse(self, access_record):
        """检查权限滥用"""
        # 检查访问频率
        if access_record["frequency"] > 100:  # 每小时超过100次
            self.alert("访问频率异常", access_record)
        
        # 检查访问范围
        if len(access_record["accessed_resources"]) > 1000:
            self.alert("访问范围异常", access_record)
    
    def alert(self, alert_type, details):
        """发送告警"""
        # 发送告警通知
        send_alert({
            "type": alert_type,
            "details": details,
            "timestamp": datetime.now()
        })
```
