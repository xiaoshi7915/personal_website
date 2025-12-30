import React, { useState, useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import QRCode from 'qrcode';

/**
 * 分享模态框组件
 * 支持分享到微信、微博、Twitter、LinkedIn，并生成二维码
 */
function ShareModalInner({ isOpen, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showWeChatQR, setShowWeChatQR] = useState(false);
  const canvasRef = useRef(null);

  // 获取当前页面URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setShareUrl(url);
      
      // 生成微信二维码
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((dataUrl) => {
          setQrCodeDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('二维码生成失败:', err);
        });
    }
  }, []);

  // 复制链接
  const copyShareUrl = async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('链接已复制到剪贴板！');
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('链接已复制到剪贴板！');
      } catch (err) {
        console.error('降级复制也失败:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // 分享到微博
  const shareToWeibo = (e) => {
    e.preventDefault();
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(document.title)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  // 分享到微信
  const shareToWeChat = (e) => {
    e.preventDefault();
    setShowWeChatQR(!showWeChatQR);
  };

  // 分享到Twitter
  const shareToTwitter = (e) => {
    e.preventDefault();
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(document.title)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  // 分享到LinkedIn
  const shareToLinkedIn = (e) => {
    e.preventDefault();
    if (typeof window === 'undefined') {
      return;
    }
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div
      className="share-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="share-modal-content"
        style={{
          position: 'relative',
          backgroundColor: 'var(--ifm-background-color)',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              color: 'var(--ifm-heading-color)',
            }}
          >
            分享页面
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--ifm-color-content-secondary)',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* 链接复制 */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'var(--ifm-color-content)',
            }}
          >
            页面链接
          </label>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--ifm-color-emphasis-300)',
                borderRadius: '6px 0 0 6px',
                backgroundColor: 'var(--ifm-background-surface-color)',
                color: 'var(--ifm-color-content)',
                fontSize: '14px',
              }}
            />
            <button
              onClick={copyShareUrl}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              复制
            </button>
          </div>
        </div>

        {/* 分享按钮 */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '12px',
              color: 'var(--ifm-color-content)',
            }}
          >
            分享到
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {/* 微博 */}
            <a
              href="#"
              onClick={shareToWeibo}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>📱</span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--ifm-color-content)',
                }}
              >
                微博
              </span>
            </a>

            {/* 微信 */}
            <a
              href="#"
              onClick={shareToWeChat}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
              }}
            >
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>💬</span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--ifm-color-content)',
                }}
              >
                微信
              </span>
            </a>

            {/* Twitter */}
            <a
              href="#"
              onClick={shareToTwitter}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
            >
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>🐦</span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--ifm-color-content)',
                }}
              >
                Twitter
              </span>
            </a>

            {/* LinkedIn */}
            <a
              href="#"
              onClick={shareToLinkedIn}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
              }}
            >
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>💼</span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--ifm-color-content)',
                }}
              >
                LinkedIn
              </span>
            </a>
          </div>

          {/* 微信二维码 */}
          {showWeChatQR && qrCodeDataUrl && (
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                backgroundColor: 'var(--ifm-background-surface-color)',
                borderRadius: '8px',
                marginTop: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--ifm-color-content-secondary)',
                  marginBottom: '8px',
                }}
              >
                扫描二维码分享到微信
              </p>
              <img
                src={qrCodeDataUrl}
                alt="微信分享二维码"
                style={{
                  maxWidth: '200px',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 分享模态框组件 - 使用BrowserOnly包装以避免SSR错误
 */
export default function ShareModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <BrowserOnly fallback={null}>
      {() => <ShareModalInner isOpen={isOpen} onClose={onClose} />}
    </BrowserOnly>
  );
}

