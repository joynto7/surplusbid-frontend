/** Shown where a screen depends on an endpoint surplusbid-backend doesn't have yet. */
export default function MissingEndpoint({ what, endpoint, count }: { what: string; endpoint: string; count?: number }) {
  return (
    <div className="card card-pad">
      <div className="card-title">{what} can't be listed yet</div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--body)', margin: '8px 0 0', maxWidth: '64ch' }}>
        {count !== undefined && (
          <>
            The dashboard reports <strong className="mono">{count}</strong> open. {' '}
          </>
        )}
        The backend has no <span className="env-name">{endpoint}</span> endpoint, so this screen can't load them. Once it exists (admin-only,
        returning the same rows as the create/resolve endpoints), this page works without further changes.
      </p>
    </div>
  );
}
