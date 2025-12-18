import React, {useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function DocFeedback({docId, docTitle}) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);

    try {
      // 保存到localStorage（实际项目中可以发送到后端API）
      const feedbacks = JSON.parse(localStorage.getItem('docFeedbacks') || '[]');
      feedbacks.push({
        docId,
        docTitle,
        feedback,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
      localStorage.setItem('docFeedbacks', JSON.stringify(feedbacks));
      
      // 可选：发送到GitHub Discussions（需要配置）
      // 实际使用时建议通过后端API代理，避免暴露token
      
      setIsSubmitted(true);
      setFeedback('');
      
      // 显示成功消息
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('提交反馈失败:', error);
      alert('反馈提交失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.feedbackContainer}>
        <div className={styles.successMessage}>
          ✅ 感谢您的反馈！我们会认真考虑您的建议。
        </div>
        <button
          className={styles.resetButton}
          onClick={() => setIsSubmitted(false)}
        >
          提交新反馈
        </button>
      </div>
    );
  }

  return (
    <div className={styles.feedbackContainer}>
      <h3 className={styles.feedbackTitle}>📝 文档反馈</h3>
      <p className={styles.feedbackDescription}>
        这篇文档对您有帮助吗？有什么建议或问题？欢迎反馈！
      </p>
      <form onSubmit={handleSubmit} className={styles.feedbackForm}>
        <textarea
          className={styles.feedbackTextarea}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="请输入您的反馈、建议或问题..."
          rows={4}
          required
        />
        <div className={styles.feedbackActions}>
          <button
            type="submit"
            className={clsx(styles.submitButton, isSubmitting && styles.submitting)}
            disabled={isSubmitting || !feedback.trim()}
          >
            {isSubmitting ? '提交中...' : '提交反馈'}
          </button>
        </div>
      </form>
    </div>
  );
}

